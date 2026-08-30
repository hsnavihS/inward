// react
import { useState } from "react";

// routing
import { useParams, Link, useNavigate } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";

// components
import EntryForm from "../components/EntryForm";
import ConfirmModal from "../components/ConfirmModal";

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { getEntry, updateEntry, deleteEntry } = useEntries();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
      <p className="dim" style={{ fontSize: "13px", marginTop: "8px" }}>
        {entry.body.trim() ? entry.body.trim().split(/\s+/).length : 0} words
      </p>
      <div className="action-bar">
        <button onClick={() => setEditing(true)}>edit</button>
        <button className="btn-danger" onClick={() => setShowDeleteModal(true)}>delete</button>
      </div>
      {showDeleteModal && (
        <ConfirmModal
          message="Delete this entry? This cannot be undone."
          onConfirm={() => { deleteEntry(id!); navigate("/"); }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  );
}
