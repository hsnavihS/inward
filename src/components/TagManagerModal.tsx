// react
import { useState, useMemo } from "react";

// context
import { useTags } from "../context/TagsContext";
import { useEntries } from "../context/EntriesContext";

// components
import SearchBar from "./SearchBar";

interface TagManagerModalProps {
  onClose: () => void;
}

export default function TagManagerModal({ onClose }: TagManagerModalProps) {
  const { tags, deleteTag } = useTags();
  const { removeTagFromAll } = useEntries();
  const [search, setSearch] = useState("");

  const handleDelete = (name: string) => {
    deleteTag(name);
    removeTagFromAll(name);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tags;
    return tags.filter((t) => t.name.includes(q));
  }, [tags, search]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal tag-manager-modal" onClick={(e) => e.stopPropagation()}>
        <h3>tags</h3>
        <SearchBar value={search} onChange={setSearch} />
        {filtered.length === 0 ? (
          <p className="dim" style={{ textAlign: "center", padding: "12px 0" }}>
            {tags.length === 0 ? "No tags yet." : "No tags match."}
          </p>
        ) : (
          <ul className="tag-manager-list">
            {filtered.map((t) => (
              <li key={t.name} className="tag-manager-item">
                <span>#{t.name}</span>
                <button
                  className="btn-danger btn-sm"
                  onClick={() => handleDelete(t.name)}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="modal-actions">
          <button onClick={onClose}>close</button>
        </div>
      </div>
    </div>
  );
}
