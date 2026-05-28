import React from "react";
import "./WeekTimeline.css";
import { groupLogsByDate } from "../utils/week";

export default function WeekTimeline({ logs = [], emptyText = "No logs for selected week", onEdit, onDelete }) {
  const grouped = groupLogsByDate(logs);
  const sortedDays = Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a));

  if (!sortedDays.length) {
    return <p className="timeline-empty">{emptyText}</p>;
  }

  return (
    <div className="timeline">
      {sortedDays.map((date) => (
        <div key={date} className="timeline-day">
          <div className="timeline-marker">
            <div className="timeline-dot" />
          </div>
          <div className="timeline-content">
            <h3 className="timeline-date">
              {new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </h3>
            <div className="logs-for-date">
              {grouped[date].map((log) => (
                <article key={log.id} className="log-card timeline-log">
                  <div className="log-header">
                    <span className="hours-badge">{log.hours}hr</span>
                    {log.tags?.length > 0 && (
                      <div className="tags">
                        {log.tags.map((tag) => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="log-content">
                    {log.done && <div className="log-section"><strong>Done</strong><p>{log.done}</p></div>}
                    {log.in_progress && <div className="log-section"><strong>In Progress</strong><p>{log.in_progress}</p></div>}
                    {log.blockers && <div className="log-section blockers"><strong>Blockers</strong><p>{log.blockers}</p></div>}
                  </div>
                  {(onEdit || onDelete) && (
                    <div className="log-actions">
                      {onEdit && <button className="btn-edit" onClick={() => onEdit(log)}>Edit</button>}
                      {onDelete && <button className="btn-delete" onClick={() => onDelete(log.id)}>Delete</button>}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
