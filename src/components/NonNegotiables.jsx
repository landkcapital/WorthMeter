import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";

function getLocalDateStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function NonNegotiables({ target, onStatsChange }) {
  const [items, setItems] = useState([]);
  const [todayEntries, setTodayEntries] = useState({});
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState(null);
  const [noteInputId, setNoteInputId] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [dailyLog, setDailyLog] = useState([]);
  const [showLog, setShowLog] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const today = getLocalDateStr();

  // Drag state
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);
  const [draggingId, setDraggingId] = useState(null);

  const fetchItems = useCallback(async () => {
    const { data } = await supabase
      .from("non_negotiables")
      .select("*")
      .eq("target_id", target.id)
      .eq("active", true)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });
    setItems(data || []);
  }, [target.id]);

  const fetchTodayEntries = useCallback(async () => {
    const { data } = await supabase
      .from("daily_completions")
      .select("non_negotiable_id, note, status")
      .eq("completed_date", today);
    const map = {};
    (data || []).forEach((c) => {
      map[c.non_negotiable_id] = {
        status: c.status || "completed",
        note: c.note || "",
      };
    });
    setTodayEntries(map);
  }, [today]);

  const fetchDailyLog = useCallback(async () => {
    const { data: allItems } = await supabase
      .from("non_negotiables")
      .select("*")
      .eq("target_id", target.id)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (!allItems || allItems.length === 0) {
      setDailyLog([]);
      return;
    }

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const startStr = toDateStr(twoWeeksAgo);

    const { data: completions } = await supabase
      .from("daily_completions")
      .select("non_negotiable_id, completed_date, note, status")
      .gte("completed_date", startStr)
      .lt("completed_date", today);

    const completionMap = {};
    (completions || []).forEach((c) => {
      if (!completionMap[c.completed_date]) completionMap[c.completed_date] = {};
      completionMap[c.completed_date][c.non_negotiable_id] = {
        status: c.status || "completed",
        note: c.note || "",
      };
    });

    const logs = [];
    const d = new Date();
    d.setDate(d.getDate() - 1);

    for (let i = 0; i < 14; i++) {
      const dateStr = toDateStr(d);
      const dayEntries = completionMap[dateStr] || {};

      const activeOnDate = allItems.filter((item) => {
        const createdDate = item.created_at.split("T")[0];
        return createdDate <= dateStr;
      });

      if (activeOnDate.length > 0) {
        const completed = [];
        const missed = [];
        const unmarked = [];

        activeOnDate.forEach((item) => {
          const entry = dayEntries[item.id];
          if (entry && entry.status === "completed") {
            completed.push({ title: item.title, note: entry.note });
          } else if (entry && entry.status === "missed") {
            missed.push({ title: item.title, note: entry.note });
          } else {
            unmarked.push({ title: item.title });
          }
        });

        logs.push({ date: dateStr, completed, missed, unmarked });
      }

      d.setDate(d.getDate() - 1);
    }

    setDailyLog(logs);
  }, [target.id, today]);

  useEffect(() => {
    fetchItems();
    fetchTodayEntries();
    fetchDailyLog();
  }, [fetchItems, fetchTodayEntries, fetchDailyLog]);

  // Report stats to parent
  useEffect(() => {
    if (onStatsChange) {
      const doneCount = Object.values(todayEntries).filter((e) => e.status === "completed").length;
      const missedCount = Object.values(todayEntries).filter((e) => e.status === "missed").length;
      onStatsChange({ done: doneCount, missed: missedCount, total: items.length });
    }
  }, [todayEntries, items.length, onStatsChange]);

  // --- Drag handlers ---
  const handleDragStart = (index) => {
    dragItem.current = index;
    setDraggingId(items[index].id);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    dragOverItem.current = index;
  };

  const handleDrop = async () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    if (dragItem.current === dragOverItem.current) {
      setDraggingId(null);
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(dragOverItem.current, 0, moved);

    setItems(reordered);
    setDraggingId(null);
    dragItem.current = null;
    dragOverItem.current = null;

    // Persist new order
    const updates = reordered.map((item, i) => ({ id: item.id, order_index: i }));
    for (const u of updates) {
      await supabase
        .from("non_negotiables")
        .update({ order_index: u.order_index })
        .eq("id", u.id);
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleComplete = async (itemId) => {
    const existing = todayEntries[itemId];
    if (existing) {
      await supabase
        .from("daily_completions")
        .update({ status: "completed", note: null })
        .eq("non_negotiable_id", itemId)
        .eq("completed_date", today);
    } else {
      await supabase.from("daily_completions").insert({
        non_negotiable_id: itemId,
        completed_date: today,
        status: "completed",
      });
    }
    setTodayEntries((prev) => ({ ...prev, [itemId]: { status: "completed", note: "" } }));
    setNoteInputId(itemId);
    setNoteText("");
  };

  const handleMiss = async (itemId) => {
    const existing = todayEntries[itemId];
    if (existing) {
      await supabase
        .from("daily_completions")
        .update({ status: "missed", note: null })
        .eq("non_negotiable_id", itemId)
        .eq("completed_date", today);
    } else {
      await supabase.from("daily_completions").insert({
        non_negotiable_id: itemId,
        completed_date: today,
        status: "missed",
      });
    }
    setTodayEntries((prev) => ({ ...prev, [itemId]: { status: "missed", note: "" } }));
    setNoteInputId(itemId);
    setNoteText("");
  };

  const handleClear = async (itemId) => {
    await supabase
      .from("daily_completions")
      .delete()
      .eq("non_negotiable_id", itemId)
      .eq("completed_date", today);
    setTodayEntries((prev) => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setNoteInputId(null);
  };

  const handleSaveNote = async (itemId) => {
    const note = noteText.trim();
    await supabase
      .from("daily_completions")
      .update({ note })
      .eq("non_negotiable_id", itemId)
      .eq("completed_date", today);
    setTodayEntries((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], note },
    }));
    setNoteInputId(null);
    setNoteText("");
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    setError(null);
    const { error: insertError } = await supabase.from("non_negotiables").insert({
      target_id: target.id,
      title,
      order_index: items.length,
    });
    if (insertError) {
      setError(insertError.message);
      setAdding(false);
      return;
    }
    setNewTitle("");
    setAdding(false);
    await fetchItems();
  };

  const handleRemove = async (itemId) => {
    if (confirmRemoveId !== itemId) {
      setConfirmRemoveId(itemId);
      return;
    }
    await supabase
      .from("non_negotiables")
      .update({ active: false })
      .eq("id", itemId);
    setConfirmRemoveId(null);
    fetchItems();
  };

  const doneCount = Object.values(todayEntries).filter((e) => e.status === "completed").length;

  return (
    <div className="non-negotiables card">
      <div className="nn-header">
        <h3>Daily Non-Negotiables</h3>
        <span className="nn-counter">
          {doneCount}/{items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="empty-text">No daily tasks yet. Add one below.</p>
      ) : (
        <ul className="nn-list">
          {items.map((item, index) => {
            const entry = todayEntries[item.id];
            const status = entry?.status;
            const savedNote = entry?.note || "";
            const isEditing = noteInputId === item.id;
            const isDone = status === "completed";
            const isMissed = status === "missed";
            const isDragging = draggingId === item.id;

            return (
              <li
                key={item.id}
                className={`nn-item-wrap ${isDragging ? "nn-dragging" : ""}`}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
              >
                <div className={`nn-item ${isDone ? "nn-done" : ""} ${isMissed ? "nn-missed" : ""}`}>
                  {/* Drag handle */}
                  <span className="nn-drag-handle" title="Drag to reorder">
                    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                      <circle cx="2" cy="2" r="1.5" /><circle cx="8" cy="2" r="1.5" />
                      <circle cx="2" cy="8" r="1.5" /><circle cx="8" cy="8" r="1.5" />
                      <circle cx="2" cy="14" r="1.5" /><circle cx="8" cy="14" r="1.5" />
                    </svg>
                  </span>

                  <button
                    className={`nn-checkbox ${isDone ? "checked" : ""}`}
                    onClick={() => isDone ? handleClear(item.id) : handleComplete(item.id)}
                    aria-label={isDone ? "Undo" : "Complete"}
                  >
                    {isDone && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7.5L5.5 10.5L11.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  <div className="nn-item-content">
                    <span className="nn-title">{item.title}</span>
                    {(isDone || isMissed) && savedNote && !isEditing && (
                      <span
                        className={`nn-saved-note ${isMissed ? "nn-saved-note-missed" : ""}`}
                        onClick={() => { setNoteInputId(item.id); setNoteText(savedNote); }}
                      >
                        {savedNote}
                      </span>
                    )}
                  </div>

                  <button
                    className={`nn-miss-btn ${isMissed ? "active" : ""}`}
                    onClick={() => isMissed ? handleClear(item.id) : handleMiss(item.id)}
                    aria-label={isMissed ? "Undo" : "Didn't do it"}
                    title={isMissed ? "Undo" : "Didn't do it"}
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>

                  {confirmRemoveId === item.id ? (
                    <div className="nn-confirm-remove">
                      <button className="nn-confirm-yes" onClick={() => handleRemove(item.id)}>Delete</button>
                      <button className="nn-confirm-no" onClick={() => setConfirmRemoveId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button
                      className="nn-remove"
                      onClick={() => setConfirmRemoveId(item.id)}
                      aria-label="Remove"
                    >
                      &times;
                    </button>
                  )}
                </div>

                {isEditing && (
                  <div className="nn-note-row">
                    <input
                      type="text"
                      className="nn-note-input"
                      placeholder={isDone ? "What did you do? (optional)" : "What happened? (optional)"}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveNote(item.id); }}
                      autoFocus
                    />
                    <button className="nn-note-save" onClick={() => handleSaveNote(item.id)}>
                      Save
                    </button>
                  </div>
                )}

                {(isDone || isMissed) && !savedNote && !isEditing && (
                  <button
                    className="nn-add-note-btn"
                    onClick={() => { setNoteInputId(item.id); setNoteText(""); }}
                  >
                    + Add note
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="form-error">{error}</p>}

      <form className="nn-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Add a non-negotiable..."
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          className="nn-add-input"
        />
        <button type="submit" className="nn-add-btn" disabled={adding || !newTitle.trim()}>
          +
        </button>
      </form>

      {dailyLog.length > 0 && (
        <div className="nn-log-section">
          <button className="nn-log-toggle" onClick={() => setShowLog(!showLog)}>
            {showLog ? "Hide" : "Show"} Daily Log
            <span className={`nn-log-arrow ${showLog ? "open" : ""}`}>&#9662;</span>
          </button>

          {showLog && (
            <div className="nn-log">
              {dailyLog.map((day) => (
                <div key={day.date} className="nn-log-day">
                  <p className="nn-log-date">{formatDate(day.date)}</p>
                  {day.completed.map((c, i) => (
                    <div key={`c-${i}`} className="nn-log-entry nn-log-done">
                      <span className="nn-log-check">&#10003;</span>
                      <div>
                        <span className="nn-log-title">{c.title}</span>
                        {c.note && <span className="nn-log-note">{c.note}</span>}
                      </div>
                    </div>
                  ))}
                  {day.missed.map((m, i) => (
                    <div key={`m-${i}`} className="nn-log-entry nn-log-missed">
                      <span className="nn-log-x">&#10007;</span>
                      <div>
                        <span className="nn-log-title">{m.title}</span>
                        {m.note && <span className="nn-log-note">{m.note}</span>}
                      </div>
                    </div>
                  ))}
                  {day.unmarked.map((u, i) => (
                    <div key={`u-${i}`} className="nn-log-entry nn-log-unmarked">
                      <span className="nn-log-dash">&mdash;</span>
                      <span className="nn-log-title">{u.title}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
