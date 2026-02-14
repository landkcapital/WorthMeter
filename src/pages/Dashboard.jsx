import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";
import TargetSetup from "../components/TargetSetup";
import LiveDisplay from "../components/LiveDisplay";
import NonNegotiables from "../components/NonNegotiables";
import PenaltyModal from "../components/PenaltyModal";
import PenaltyHistory from "../components/PenaltyHistory";

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Dashboard() {
  const [target, setTarget] = useState(null);
  const [penalties, setPenalties] = useState([]);
  const [totalPenalties, setTotalPenalties] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPenalty, setShowPenalty] = useState(false);
  const [nnStats, setNnStats] = useState({ done: 0, missed: 0, total: 0 });
  const [pastHistory, setPastHistory] = useState([]);

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

  const fetchPastHistory = useCallback(async () => {
    if (!target) return;

    // Fetch all NNs (including inactive) for this target
    const { data: allNNs } = await supabase
      .from("non_negotiables")
      .select("id, created_at, active")
      .eq("target_id", target.id);

    if (!allNNs || allNNs.length === 0) {
      setPastHistory([]);
      return;
    }

    // Fetch all completions for this target's NNs
    const nnIds = allNNs.map((nn) => nn.id);
    const { data: completions } = await supabase
      .from("daily_completions")
      .select("non_negotiable_id, completed_date, status")
      .in("non_negotiable_id", nnIds);

    // Track which NNs ever had completions (so deactivated ones still count for their active period)
    const nnIdsWithCompletions = new Set(
      (completions || []).map((c) => c.non_negotiable_id)
    );

    // Only include NNs that are currently active OR have completion records
    const relevantNNs = allNNs.filter(
      (nn) => nn.active || nnIdsWithCompletions.has(nn.id)
    );

    // Build completion map: date -> count of completed
    const completionMap = {};
    (completions || []).forEach((c) => {
      if (c.status === "completed") {
        completionMap[c.completed_date] = (completionMap[c.completed_date] || 0) + 1;
      }
    });

    // Build history for each day from target creation to yesterday
    const history = [];
    const startDate = new Date(target.created_at);
    startDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const d = new Date(startDate);
    while (d < today) {
      const dateStr = toDateStr(d);

      // Count NNs active on this day (created on or before this date)
      const activeCount = relevantNNs.filter((nn) => {
        const createdDate = nn.created_at.split("T")[0];
        return createdDate <= dateStr;
      }).length;

      if (activeCount > 0) {
        history.push({
          date: dateStr,
          completed: completionMap[dateStr] || 0,
          total: activeCount,
        });
      }

      d.setDate(d.getDate() + 1);
    }

    setPastHistory(history);
  }, [target]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchPastHistory();
  }, [fetchPastHistory]);

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
      <LiveDisplay
        target={target}
        totalPenalties={totalPenalties}
        nnStats={nnStats}
        pastHistory={pastHistory}
      />

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
