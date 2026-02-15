import { useState, useEffect, useRef } from "react";
import { calculateWorth, calculateAdjustedDate, formatCurrency } from "../lib/worthLogic";

export default function LiveDisplay({ target, totalPenalties, nnStats, focusMode }) {
  const [value, setValue] = useState(() =>
    calculateWorth(target, totalPenalties)
  );
  const prevValue = useRef(value);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = calculateWorth(target, totalPenalties);
      setValue(next);
    }, 1000);

    return () => clearInterval(interval);
  }, [target, totalPenalties]);

  useEffect(() => {
    if (value < prevValue.current) {
      setFlash(true);
      const timeout = setTimeout(() => setFlash(false), 600);
      return () => clearTimeout(timeout);
    }
    prevValue.current = value;
  }, [value]);

  const isNegative = value < 0;
  const originalDate = new Date(target.target_date).toLocaleDateString();
  const adjustedDate = calculateAdjustedDate(target, totalPenalties);

  return (
    <div className={`live-display ${flash ? "flash-red" : ""}`}>
      <p className="live-label">Current Worth</p>
      <p className={`live-value ${isNegative ? "negative" : "positive"}`}>
        {formatCurrency(value)}
      </p>
      <p className="live-sub">
        Target: {formatCurrency(target.target_amount)} by{" "}
        {adjustedDate ? (
          <>
            <span className="date-original">{originalDate}</span>{" "}
            <span className="date-adjusted">{adjustedDate.toLocaleDateString()}</span>
          </>
        ) : (
          originalDate
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
