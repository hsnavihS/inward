// react
import { useState } from "react";

// routing
import { useParams, Link } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";

// components
import EntryForm from "../components/EntryForm";

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { getEntry, updateEntry } = useEntries();
  const [editing, setEditing] = useState(false);

  const entry = getEntry(id!);

  if (!entry) {
    return (
      <div>
        <p className="dim">Entry not found.</p>
        <Link to="/">{'<'} back</Link>
      </div>
    );
  }

  if (editing) {
    return (
      <div>
        <h1>Edit Entry</h1>
        <EntryForm
          initialTitle={entry.title}
          initialBody={entry.body}
          initialTags={entry.tags}
          submitLabel="update"
          onSubmit={({ title, body, tags }) => {
            updateEntry(id!, { title, body, tags });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
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
      <div className="action-bar">
        <button onClick={() => setEditing(true)}>edit</button>
      </div>
    </div>
  );
}
