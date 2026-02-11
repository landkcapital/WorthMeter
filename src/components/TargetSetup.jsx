import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function TargetSetup({ onSaved }) {
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [startAmount, setStartAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("targets")
      .insert({
        target_amount: parseFloat(targetAmount),
        target_date: new Date(targetDate).toISOString(),
        start_amount: startAmount ? parseFloat(startAmount) : 0,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="card target-setup">
      <h2>Set Your Target</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-row-2">
          <div className="form-group">
            <label>Target Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="100,000.00"
              required
            />
          </div>
          <div className="form-group">
            <label>Target Date</label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-group">
          <label>Starting Amount (optional)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={startAmount}
            onChange={(e) => setStartAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>
        {error && <p className="form-error">{error}</p>}
        <button type="submit" className="btn primary" disabled={saving}>
          {saving ? "Saving..." : "Lock In Target"}
        </button>
      </form>
    </div>
  );
}
