export function nowIso() {
  return new Date().toISOString();
}

export function addHours(date, hours) {
  const base = date instanceof Date ? date : new Date(date);
  return new Date(base.getTime() + Number(hours) * 60 * 60 * 1000);
}

export function addDays(date, days) {
  return addHours(date, Number(days) * 24);
}

export function isPast(date) {
  const value = date instanceof Date ? date : new Date(date);
  return value.getTime() <= Date.now();
}

export function toUnixSeconds(date = new Date()) {
  const value = date instanceof Date ? date : new Date(date);
  return Math.floor(value.getTime() / 1000);
}

export default {
  nowIso,
  addHours,
  addDays,
  isPast,
  toUnixSeconds,
};
