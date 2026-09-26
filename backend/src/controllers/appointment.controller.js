import { Appointments } from '../repositories/appointments.js';
import { asyncHandler } from '../utils/ApiError.js';
import { bookAppointment, publicSlots } from '../services/appointment.service.js';
import { handlers } from './resourceHandlers.js';

export const slots = asyncHandler(async (_req, res) => res.json({ timezone: 'IST', days: await publicSlots() }));

export const book = asyncHandler(async (req, res) => {
  const appt = await bookAppointment({ ...req.body, ip: req.ip });
  res.status(201).json({ ok: true, label: appt.slotLabel, email: appt.email });
});

export const appointmentsResource = handlers(Appointments, {
  csvColumns: [
    { label: 'Booked', key: 'createdAt' }, { label: 'Call time', key: 'slotLabel' }, { label: 'Status', key: 'status' },
    { label: 'Name', key: 'name' }, { label: 'Organization', key: 'organization' }, { label: 'Email', key: 'email' },
    { label: 'Phone', key: 'phone' }, { label: 'Booked from', key: 'source' }, { label: 'Notes', key: 'notes' },
  ],
});
