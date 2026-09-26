import { Appointments } from '../repositories/appointments.js';
import { ApiError } from '../utils/ApiError.js';
import { getSetting } from './settings.service.js';
import { notifyTeam, sendAppointmentConfirmation } from './mail.service.js';

const IST_OFFSET_MS = 5.5 * 3600 * 1000;
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n) => String(n).padStart(2, '0');

/** "2:30 PM" → minutes after midnight, or null if it isn't a valid clock time. */
function minutesOf(time) {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(String(time).trim());
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === 'PM') h += 12;
  const min = Number(m[2]);
  return Number(m[1]) >= 1 && Number(m[1]) <= 12 && min < 60 ? h * 60 + min : null;
}

/** IST wall-clock (Y, M, D, minutes) → the UTC instant. */
const istToUtc = (y, m, d, minutes) => new Date(Date.UTC(y, m, d, 0, 0) + minutes * 60000 - IST_OFFSET_MS);

/**
 * The bookable calendar, built in IST: the next N working days (Mon–Fri, starting tomorrow) × the configured times.
 * Each slot knows whether it is still free, so the site can grey out taken ones and the server can re-check on booking.
 */
export async function buildSlots(now = new Date()) {
  const site = await getSetting('site');
  const times = (site.bookingTimes || []).filter((t) => minutesOf(t) !== null);
  const capacity = Math.max(1, Number(site.bookingCapacity) || 1);
  const istNow = new Date(now.getTime() + IST_OFFSET_MS); // its UTC fields read as IST wall-clock
  const cursor = new Date(Date.UTC(istNow.getUTCFullYear(), istNow.getUTCMonth(), istNow.getUTCDate()));

  const days = [];
  while (days.length < Math.max(1, Number(site.bookingDaysAhead) || 5)) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
    const dow = cursor.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    const y = cursor.getUTCFullYear(); const m = cursor.getUTCMonth(); const d = cursor.getUTCDate();
    days.push({
      date: `${y}-${pad(m + 1)}-${pad(d)}`,
      label: `${DAY_NAMES[dow]}, ${d} ${MONTH_NAMES[m]}`,
      slots: times.map((time) => ({ time, start: istToUtc(y, m, d, minutesOf(time)) })),
    });
  }
  const first = days[0]?.slots[0]?.start || now;
  const last = days.at(-1)?.slots.at(-1)?.start || now;
  const taken = await Appointments.takenCounts(new Date(first.getTime() - 1), new Date(last.getTime() + 1));
  return days.map((day) => ({
    ...day,
    slots: day.slots.map((s) => ({ ...s, available: (taken.get(s.start.getTime()) || 0) < capacity })),
  }));
}

export async function publicSlots() {
  return (await buildSlots()).map((d) => ({
    date: d.date, label: d.label, times: d.slots.map((s) => ({ time: s.time, available: s.available })),
  }));
}

export async function bookAppointment({ name, organization, email, phone, date, time, source, ip }) {
  const day = (await buildSlots()).find((d) => d.date === date);
  const slot = day?.slots.find((s) => s.time === time);
  if (!slot) throw ApiError.badRequest('That day or time is not available. Please pick one from the list.');
  const site = await getSetting('site');
  const capacity = Math.max(1, Number(site.bookingCapacity) || 1);
  if ((await Appointments.countAt(slot.start)) >= capacity) throw ApiError.conflict('Sorry, that slot has just been taken — please pick another time.');

  const label = `${day.label} at ${slot.time} IST`;
  const id = await Appointments.create({ name, organization, email, phone, slotStart: slot.start, slotLabel: label, source, ip });
  const appt = { id, name, organization, email, phone, slotStart: slot.start, slotLabel: label };

  notifyTeam('lead', `Call booked — ${label}`, { Name: name, Organization: organization, Email: email, Phone: phone, Slot: label, 'Booked from': source === 'home' ? 'Home page' : 'Contact page' }, email);
  sendAppointmentConfirmation(appt); // fire-and-forget: the booking is already saved
  return appt;
}
