import { formatCurrency } from "../lib/worthLogic";

export default function PenaltyHistory({ penalties }) {
  if (penalties.length === 0) {
    return (
      <div className="card penalty-history">
        <h3>Penalty Log</h3>
        <p className="empty-text">No penalties yet. Stay on track.</p>
      </div>
    );
  }

  return (
    <div className="card penalty-history">
      <h3>Penalty Log</h3>
      <div className="penalty-list">
        {penalties.map((p) => (
          <div key={p.id} className="penalty-item">
            <div className="penalty-info">
              <span className="penalty-amount negative">
                -{formatCurrency(p.amount)}
              </span>
              <span className="penalty-reason">
                {p.reason || "No reason given"}
              </span>
            </div>
            <span className="penalty-date">
              {new Date(p.created_at).toLocaleDateString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
