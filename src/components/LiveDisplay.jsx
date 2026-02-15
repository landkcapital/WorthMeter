import { useState, useEffect, useRef, useMemo } from "react";
import { calculateWorth, calculateAdjustedDate, dailyWorthIncrease, formatCurrency } from "../lib/worthLogic";

export default function LiveDisplay({ target, totalPenalties, nnStats, pastHistory, focusMode }) {
  const [flash, setFlash] = useState(null);

  // Build full completion history: past days + today
  const completionHistory = useMemo(() => {
    const history = [...(pastHistory || [])];
    if (nnStats && nnStats.total > 0) {
      history.push({ completed: nnStats.done, total: nnStats.total });
    }
    return history;
  }, [pastHistory, nnStats]);

  const value = calculateWorth(target, totalPenalties, completionHistory);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value !== prevValue.current) {
      setFlash(value > prevValue.current ? "up" : "down");
      const timeout = setTimeout(() => setFlash(null), 600);
      prevValue.current = value;
      return () => clearTimeout(timeout);
    }
  }, [value]);

  const isNegative = value < 0;
  const adjustedDate = calculateAdjustedDate(target, pastHistory || []);

  // Per-task chunk value for today
  const daily = dailyWorthIncrease(target);
  const taskValue = nnStats && nnStats.total > 0 ? daily / nnStats.total : 0;

  // Format dates — adjusted date includes time (hours)
  const originalDateStr = new Date(target.target_date).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });
  const adjustedDateStr = adjustedDate
    ? adjustedDate.toLocaleDateString("en-US", {
        month: "short", day: "numeric", year: "numeric",
      }) +
      " at " +
      adjustedDate.toLocaleTimeString("en-US", {
        hour: "numeric", minute: "2-digit",
      })
    : null;

  const flashClass = flash === "up" ? "flash-green" : flash === "down" ? "flash-red" : "";

  return (
    <div className={`live-display ${flashClass}`}>
      <p className="live-label">Current Worth</p>
      <p className={`live-value ${isNegative ? "negative" : "positive"}`}>
        {formatCurrency(value)}
      </p>
      {!focusMode && nnStats && nnStats.total > 0 && (
        <p className="live-task-value">Each task: +{formatCurrency(taskValue)}</p>
      )}
      <p className="live-sub">
        Target: {formatCurrency(target.target_amount)} by{" "}
        {adjustedDateStr ? (
          <>
            <span className="date-original">{originalDateStr}</span>{" "}
            <span className="date-adjusted">{adjustedDateStr}</span>
          </>
        ) : (
          originalDateStr
        )}
      </p>
      {!focusMode && nnStats && nnStats.total > 0 && (
        <p className="live-stats">
          <span className="live-stat-up">&#9650; {nnStats.done}</span>
          <span className="live-stat-down">&#9660; {nnStats.missed}</span>
        </p>
      )}
    </div>
  );
}
