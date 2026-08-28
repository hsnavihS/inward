import { Link } from "react-router-dom";
import { useEntries } from "../context/EntriesContext";

export default function Home() {
  const { entries } = useEntries();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Inward</h1>
        <Link to="/create">New Entry</Link>
      </div>

      {entries.length === 0 ? (
        <p>No entries yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {entries.map((e) => (
            <li key={e.id} style={{ marginBottom: "0.5rem" }}>
              <Link to={`/entry/${e.id}`}>
                <strong>{e.title}</strong>
                <span style={{ marginLeft: "1rem", opacity: 0.6 }}>
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </Link>
              {e.tags.length > 0 && (
                <span style={{ marginLeft: "0.5rem", fontSize: "0.8rem" }}>
                  {e.tags.map((t) => `#${t.name}`).join(" ")}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
