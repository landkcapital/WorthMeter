/**
 * Calculate daily worth increase (per calendar day).
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
 * Calculate current worth based on completed non-negotiables.
 * Each day's profit is divided equally among that day's active NNs.
 * Worth only increases when you tick off a non-negotiable.
 *
 * @param {Object} target
 * @param {number} totalPenalties
 * @param {Array<{completed: number, total: number}>} completionHistory - past days + today
 */
export function calculateWorth(target, totalPenalties, completionHistory) {
  if (!target) return 0;

  const daily = dailyWorthIncrease(target);
  let earned = target.start_amount || 0;

  for (const day of completionHistory || []) {
    if (day.total > 0) {
      earned += (daily / day.total) * day.completed;
    }
  }

  return earned - totalPenalties;
}

/**
 * Calculate adjusted target date based on missed non-negotiables.
 * Only past days count — today is still in progress.
 * Each missed NN adds (24 hours / total NNs that day) to the completion date.
 *
 * @param {Object} target
 * @param {Array<{completed: number, total: number}>} pastHistory - past days only
 */
export function calculateAdjustedDate(target, pastHistory) {
  if (!target || !pastHistory) return null;

  const dayMs = 24 * 60 * 60 * 1000;
  let missedMs = 0;

  for (const day of pastHistory) {
    if (day.total > 0) {
      const missed = day.total - day.completed;
      if (missed > 0) {
        missedMs += (dayMs / day.total) * missed;
      }
    }
  }

  if (missedMs <= 0) return null;

  const end = new Date(target.target_date).getTime();
  return new Date(end + missedMs);
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
