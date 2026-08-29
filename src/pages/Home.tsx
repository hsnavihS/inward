// routing
import { Link } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";

export default function Home() {
  const { entries, loading } = useEntries();

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
            <li key={e.id}>
              <Link to={`/entry/${e.id}`} style={{ borderBottom: "none" }}>
                <strong>{e.title}</strong>
                <span className="dim" style={{ marginLeft: "1rem", fontSize: "13px" }}>
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </Link>
              {e.tags.length > 0 && (
                <div style={{ marginTop: "6px" }}>
                  {e.tags.map((t) => (
                    <span key={t.name} className="tag">#{t.name}</span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
