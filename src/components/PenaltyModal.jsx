import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function PenaltyModal({ targetId, onClose, onAdded }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!amount) return;

    setSaving(true);
    setError(null);

    const { error: insertError } = await supabase
      .from("penalties")
      .insert({
        target_id: targetId,
        amount: parseFloat(amount),
        reason: reason || null,
      });

    if (insertError) {
      setError(insertError.message);
      setSaving(false);
      return;
    }

    onAdded();
    onClose();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Penalty</h2>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Penalty Amount</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Reason (optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What happened?"
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn danger-btn" disabled={saving}>
            {saving ? "Saving..." : "Apply Penalty"}
          </button>
        </form>
      </div>
    </div>
  );
}
