// Simple in-memory session storage
// For production, use Redis or a database
const sessions = new Map();

/**
 * Session states
 */
export const SessionState = {
  IDLE: 'idle',
  WAITING_FOR_JD: 'waiting_for_jd',
  WAITING_FOR_RESUME: 'waiting_for_resume',
  PROCESSING: 'processing',
};

/**
 * Get user session
 */
export function getSession(userId) {
  if (!sessions.has(userId)) {
    sessions.set(userId, {
      state: SessionState.IDLE,
      jobDescription: null,
      resume: null,
    });
  }
  return sessions.get(userId);
}

/**
 * Update session
 */
export function updateSession(userId, data) {
  const session = getSession(userId);
  Object.assign(session, data);
  sessions.set(userId, session);
  return session;
}

/**
 * Clear user session
 */
export function clearSession(userId) {
  sessions.delete(userId);
}

/**
 * Get all sessions (for debugging)
 */
export function getAllSessions() {
  return Array.from(sessions.entries());
}
