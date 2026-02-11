import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import TargetSetup from "../components/TargetSetup";
import LiveDisplay from "../components/LiveDisplay";
import NonNegotiables from "../components/NonNegotiables";
import PenaltyModal from "../components/PenaltyModal";
import PenaltyHistory from "../components/PenaltyHistory";

export default function Dashboard() {
  const [target, setTarget] = useState(null);
  const [penalties, setPenalties] = useState([]);
  const [totalPenalties, setTotalPenalties] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPenalty, setShowPenalty] = useState(false);
  const [nnStats, setNnStats] = useState({ done: 0, missed: 0, total: 0 });

  const fetchData = useCallback(async () => {
    const { data: targets } = await supabase
      .from("targets")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    const activeTarget = targets?.[0] || null;
    setTarget(activeTarget);

    if (activeTarget) {
      const { data: penaltyData } = await supabase
        .from("penalties")
        .select("*")
        .eq("target_id", activeTarget.id)
        .order("created_at", { ascending: false });

      const list = penaltyData || [];
      setPenalties(list);
      setTotalPenalties(list.reduce((sum, p) => sum + p.amount, 0));
    } else {
      setPenalties([]);
      setTotalPenalties(0);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  if (!target) {
    return (
      <div className="page">
        <TargetSetup onSaved={fetchData} />
      </div>
    );
  }

  return (
    <div className="page">
      <LiveDisplay target={target} totalPenalties={totalPenalties} nnStats={nnStats} />

      <NonNegotiables target={target} onStatsChange={setNnStats} />

      <PenaltyHistory penalties={penalties} />

      <button className="fab" onClick={() => setShowPenalty(true)}>
        &minus;
      </button>

      {showPenalty && (
        <PenaltyModal
          targetId={target.id}
          onClose={() => setShowPenalty(false)}
          onAdded={fetchData}
        />
      )}
    </div>
  );
}
