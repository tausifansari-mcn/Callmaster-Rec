/**
 * An audit failure with two messages: `message` (technical, stored for admins / logs) and
 * `publicMessage` (safe to show to the visitor — never contains keys, URLs or provider internals).
 */
export class AuditError extends Error {
  constructor(code, message, publicMessage) {
    super(message);
    this.code = code;
    this.publicMessage = publicMessage || 'We could not audit this call right now. Please try again in a few minutes.';
  }
}

export const NO_SPEECH = () =>
  new AuditError('NO_SPEECH', 'No usable speech detected in the recording', "We couldn't detect enough speech in this recording to audit it. Please upload a clearer call recording.");
