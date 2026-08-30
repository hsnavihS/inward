// react
import { useState, useEffect } from "react";

// routing
import { useParams, useNavigate } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";
import { useTheme } from "../context/ThemeContext";

// components
import Navbar from "../components/Navbar";
import EntryForm from "../components/EntryForm";
import ConfirmModal from "../components/ConfirmModal";
import ImagePreviewModal from "../components/ImagePreviewModal";
import ReactMarkdown from "react-markdown";

export default function EntryDetail() {
  const { id } = useParams<{ id: string }>();
  const { getEntry, updateEntry, deleteEntry } = useEntries();
  const { setTemporaryTheme, restoreTheme } = useTheme();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const entry = getEntry(id!);

  // Apply entry's mood as temporary theme
  useEffect(() => {
    if (entry?.mood) {
      setTemporaryTheme(entry.mood);
    }
    return () => restoreTheme();
  }, [entry?.mood, setTemporaryTheme, restoreTheme]);

  const formatTime = (ts: EpochTimeStamp) =>
    // dd/mm/yy, hh:mm
    new Date(ts).toLocaleString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });

  if (!entry) {
    return (
      <div>
        <Navbar left={<button onClick={() => navigate(-1)}>back</button>} />
        <p className="dim">Entry not found.</p>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="page-full">
        <Navbar left={<button onClick={() => setEditing(false)}>back</button>} />
        <h1>Edit Entry</h1>
        <EntryForm
          initialTitle={entry.title}
          initialBody={entry.body}
          initialTags={entry.tags}
          initialImages={entry.images}
          initialMood={entry.mood}
          submitLabel="update"
          onSubmit={({ title, body, tags, images, mood }) => {
            updateEntry(id!, { title, body, tags, images, mood });
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div>
      <Navbar left={<button onClick={() => navigate(-1)}>back</button>} />
      <h1>{entry.title}</h1>
      <div className="entry-meta" style={{ display: "flex", justifyContent: "space-between" }}>
        <span>C: {formatTime(entry.createdAt)}</span>
        <span className="dim" style={{ fontSize: "13px" }}>
          W: {(() => {
            const plain = entry.body.replace(/[#*_~`>\[\]()!|-]/g, "").trim();
            return plain ? plain.split(/\s+/).length : 0;
          })()}
        </span>
        {entry.updatedAt !== entry.createdAt && (
          <span>E: {formatTime(entry.updatedAt)}</span>
        )}
      </div>
      <hr className="divider" />
      <div className="entry-body markdown-body">
        <ReactMarkdown>{entry.body}</ReactMarkdown>
      </div>
      {entry.images && entry.images.length > 0 && (
        <div className="image-gallery-row">
          {entry.images.map((url, i) => (
            <div key={url} className="image-gallery-item" onClick={() => setPreviewImage(url)}>
              <img src={url} alt={`attachment ${i + 1}`} />
            </div>
          ))}
        </div>
      )}
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
      {previewImage && (
        <ImagePreviewModal
          src={previewImage}
          onClose={() => setPreviewImage(null)}
        />
      )}
    </div>
  );
}
