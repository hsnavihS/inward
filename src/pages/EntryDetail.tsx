// routing
import { useParams, Link } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { getEntry } = useEntries();

  const entry = getEntry(id!);

  if (!entry) {
    return (
      <div>
        <p className="dim">Entry not found.</p>
        <Link to="/">{'<'} back</Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/" className="back-link">{'<'} back</Link>
      <h1>{entry.title}</h1>
      <div className="entry-meta">
        <span>Created: {new Date(entry.createdAt).toLocaleString()}</span>
        {entry.updatedAt !== entry.createdAt && (
          <span style={{ marginLeft: "1rem" }}>
            Edited: {new Date(entry.updatedAt).toLocaleString()}
          </span>
        )}
      </div>
      {entry.tags.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          {entry.tags.map((t) => (
            <span key={t.name} className="tag">#{t.name}</span>
          ))}
        </div>
      )}
      <div className="entry-body">{entry.body}</div>
    </div>
  );
}
