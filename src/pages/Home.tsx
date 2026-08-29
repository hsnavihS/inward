// react
import { useState } from "react";

// routing
import { Link } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";

// components
import ConfirmModal from "../components/ConfirmModal";

export default function Home() {
  const { entries, loading, deleteEntry } = useEntries();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (loading) {
    return (
      <div>
        <div className="header">
          <h1>Inward</h1>
        </div>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1>Inward</h1>
        <Link to="/create">[ + new ]</Link>
      </div>

      {entries.length === 0 ? (
        <p className="empty-state">No entries yet. Start writing.</p>
      ) : (
        <ul>
          {entries.map((e) => (
            <li key={e.id} className="entry-row">
              <Link to={`/entry/${e.id}`} style={{ borderBottom: "none", flex: 1 }}>
                <strong>{e.title}</strong>
                <span className="dim" style={{ marginLeft: "1rem", fontSize: "13px" }}>
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </Link>
              <button
                className="btn-danger btn-sm"
                onClick={() => setDeleteId(e.id)}
              >×</button>
              {e.tags.length > 0 && (
                <div style={{ marginTop: "6px", width: "100%" }}>
                  {e.tags.map((t) => (
                    <span key={t.name} className="tag">#{t.name}</span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {deleteId && (
        <ConfirmModal
          message="Delete this entry? This cannot be undone."
          onConfirm={() => { deleteEntry(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
