/**
 * Calculate current worth based on linear growth from start_amount
 * toward target_amount over the duration, minus total penalties.
 */
export function calculateWorth(target, totalPenalties) {
  if (!target) return 0;

  const now = Date.now();
  const start = new Date(target.created_at).getTime();
  const end = new Date(target.target_date).getTime();
  const duration = end - start;

  if (duration <= 0) return target.target_amount - totalPenalties;

  const elapsed = now - start;
  const progress = Math.min(Math.max(elapsed / duration, 0), 1);

  const startAmount = target.start_amount || 0;
  const baseValue = startAmount + (target.target_amount - startAmount) * progress;

  return baseValue - totalPenalties;
}

/**
 * Calculate the adjusted target date accounting for penalties.
 * Penalties slow progress, so the date extends proportionally.
 */
export function calculateAdjustedDate(target, totalPenalties) {
  if (!target || totalPenalties <= 0) return null;

  const start = new Date(target.created_at).getTime();
  const end = new Date(target.target_date).getTime();
  const originalDuration = end - start;
  const range = target.target_amount - (target.start_amount || 0);

  if (range <= 0 || originalDuration <= 0) return null;

  const newDuration = originalDuration * (range + totalPenalties) / range;
  return new Date(start + newDuration);
}

/**
 * Calculate the daily worth increase (per calendar day).
 */
export function dailyWorthIncrease(target) {
  if (!target) return 0;
  const start = new Date(target.created_at).getTime();
  const end = new Date(target.target_date).getTime();
  const days = (end - start) / (1000 * 60 * 60 * 24);
  if (days <= 0) return 0;
  const range = target.target_amount - (target.start_amount || 0);
  return range / days;
}

/**
 * Format a number as currency.
 */
export function formatCurrency(value) {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return value < 0 ? `-$${formatted}` : `$${formatted}`;
}
