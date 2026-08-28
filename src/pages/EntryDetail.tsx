import { useParams, Link } from "react-router-dom";
import { useEntries } from "../context/EntriesContext";

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { getEntry } = useEntries();

  const entry = getEntry(id!);

  if (!entry) {
    return (
      <div>
        <p>Entry not found.</p>
        <Link to="/">Back</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <Link to="/">Back</Link>
      <h1>{entry.title}</h1>
      <div style={{ fontSize: "0.8rem", opacity: 0.6, marginBottom: "1rem" }}>
        <span>Created: {new Date(entry.createdAt).toLocaleString()}</span>
        {entry.updatedAt !== entry.createdAt && (
          <span style={{ marginLeft: "1rem" }}>
            Edited: {new Date(entry.updatedAt).toLocaleString()}
          </span>
        )}
      </div>
      {entry.tags.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          {entry.tags.map((t) => (
            <span key={t.name} style={{ marginRight: "0.5rem" }}>#{t.name}</span>
          ))}
        </div>
      )}
      <div style={{ whiteSpace: "pre-wrap" }}>{entry.body}</div>
    </div>
  );
}
