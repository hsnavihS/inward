// react
import { useState } from "react";

// routing
import { useParams, useNavigate } from "react-router-dom";

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

  const formatTime = (ts: EpochTimeStamp) =>
    new Date(ts).toLocaleString(undefined, {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  if (!entry) {
    return (
      <div>
        <p className="dim">Entry not found.</p>
        <button onClick={() => navigate("/")}>back</button>
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
      <button className="back-link" onClick={() => navigate("/")}>back</button>
      <h1>{entry.title}</h1>
      <div className="entry-meta" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>Created: {formatTime(entry.createdAt)}</span>
        <span className="dim" style={{ fontSize: "13px" }}>
          {entry.body.trim() ? entry.body.trim().split(/\s+/).length : 0} words
        </span>
        {entry.updatedAt !== entry.createdAt && (
          <span>Edited: {formatTime(entry.updatedAt)}</span>
        )}
      </div>
      <div className="entry-body">{entry.body}</div>
      {entry.tags.length > 0 && (
        <div style={{ margin: "12px 0px" }}>
          {entry.tags.map((t) => (
            <span key={t.name} className="tag">#{t.name}</span>
          ))}
        </div>
      )}
      <hr className="divider" />
      <div className="action-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
