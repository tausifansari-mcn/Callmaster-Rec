import fs from 'node:fs';
import path from 'node:path';
import { env } from '../../config/env.js';
import { AuditError, NO_SPEECH } from './errors.js';

const MIME = {
  '.mp3': 'audio/mpeg', '.mpeg': 'audio/mpeg', '.mpga': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
  '.ogg': 'audio/ogg', '.aac': 'audio/aac', '.flac': 'audio/flac', '.amr': 'audio/amr', '.wma': 'audio/x-ms-wma',
};

const MIN_WORDS = 15;

async function listen(buffer, contentType, extraParams) {
  const params = new URLSearchParams({
    model: env.audit.deepgramModel,
    smart_format: 'true',
    punctuate: 'true',
    diarize: 'true', // who is speaking — the audit needs agent vs customer
    utterances: 'true',
    ...extraParams,
  });
  return fetch(`https://api.deepgram.com/v1/listen?${params}`, {
    method: 'POST',
    headers: { Authorization: `Token ${env.audit.deepgramKey}`, 'Content-Type': contentType },
    body: buffer,
    signal: AbortSignal.timeout(240000),
  });
}

/** Merges consecutive fragments from the same speaker into readable turns. */
function toTurns(utterances) {
  const turns = [];
  for (const u of utterances) {
    const text = String(u.transcript || '').trim();
    if (!text) continue;
    const speaker = Number.isInteger(u.speaker) ? u.speaker : 0;
    const last = turns[turns.length - 1];
    if (last && last.speaker === speaker) {
      last.text += ` ${text}`;
      last.end = u.end;
    } else {
      turns.push({ speaker, start: Number(u.start) || 0, end: Number(u.end) || 0, text });
    }
  }
  return turns;
}

/**
 * Speech-to-text with speaker labels. Returns { turns, durationSec, languages, wordCount }.
 * `language=multi` lets one pass handle English, Hindi and mixed (Hinglish) calls.
 */
export async function transcribe(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  const contentType = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';

  let res;
  try {
    res = await listen(buffer, contentType, { language: env.audit.deepgramLanguage });
    // Some models/regions reject the multilingual mode — fall back to automatic language detection.
    if (res.status === 400 && env.audit.deepgramLanguage === 'multi') res = await listen(buffer, contentType, { detect_language: 'true' });
  } catch (err) {
    throw new AuditError('DEEPGRAM_NETWORK', `Deepgram request failed: ${err.message}`, 'The transcription service did not respond in time. Please try again.');
  }

  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 300);
    const publicMessage = res.status === 400
      ? "We couldn't read this audio file. Please upload a standard MP3, WAV or M4A call recording."
      : undefined;
    throw new AuditError(`DEEPGRAM_${res.status}`, `Deepgram responded ${res.status}: ${detail}`, publicMessage);
  }

  const body = await res.json();
  const turns = toTurns(body.results?.utterances || []);
  const wordCount = turns.reduce((n, t) => n + t.text.split(/\s+/).length, 0);
  if (wordCount < MIN_WORDS) throw NO_SPEECH();

  const alt = body.results?.channels?.[0]?.alternatives?.[0];
  return {
    turns,
    durationSec: Math.round(body.metadata?.duration || turns[turns.length - 1].end),
    languages: alt?.languages || (body.results?.channels?.[0]?.detected_language ? [body.results.channels[0].detected_language] : []),
    wordCount,
  };
}
