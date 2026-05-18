import { panelConfig } from './config.js';

export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(
    panelConfig.maxLimit,
    Math.max(1, parseInt(query.limit, 10) || panelConfig.defaultLimit)
  );
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginationMeta(page, limit, total) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return { page, limit, total, totalPages };
}

export function panelListResponse(data, pagination) {
  return {
    contractVersion: '2',
    data,
    pagination,
  };
}

export function panelItemResponse(data) {
  return {
    contractVersion: '2',
    data,
  };
}

export function panelError(res, status, error, message) {
  return res.status(status).json({ error, message });
}

/** YYYY-MM-DD in configured timezone (approx via Intl). */
export function formatDateInTimezone(date, timeZone) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function startOfDayInTimezone(dateStr, timeZone) {
  const probe = new Date(`${dateStr}T12:00:00.000Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  }).formatToParts(probe);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT';
  const match = offsetPart.match(/GMT([+-]\d{1,2})(?::(\d{2}))?/);
  let offsetMinutes = 0;
  if (match) {
    const hours = parseInt(match[1], 10);
    const mins = match[2] ? parseInt(match[2], 10) : 0;
    offsetMinutes = hours * 60 + (hours < 0 ? -mins : mins);
  }
  const utcMs = Date.parse(`${dateStr}T00:00:00.000Z`) - offsetMinutes * 60 * 1000;
  return new Date(utcMs);
}

export function endOfDayInTimezone(dateStr, timeZone) {
  const start = startOfDayInTimezone(dateStr, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

export function parseDateQuery(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

export function shallowMergeExtras(existing = {}, patch = {}) {
  return { ...existing, ...patch };
}
