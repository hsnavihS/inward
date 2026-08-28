import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEntries } from "../context/EntriesContext";
import { useTags } from "../context/TagsContext";
import type { Tag } from "../types/Tag";

export default function CreateEntry() {
  const { addEntry } = useEntries();
  const { addTag, searchTags } = useTags();
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<Tag[]>([]);

  const suggestions = tagInput.trim()
    ? searchTags(tagInput).filter((t) => !tags.some((s) => s.name === t.name))
    : [];

  const selectTag = (name: string) => {
    const tag = addTag(name);
    if (!tag || tags.some((t) => t.name === tag.name) || tags.length >= 5) return;
    setTags([...tags, tag]);
    setTagInput("");
  };

  const removeTag = (name: string) => setTags(tags.filter((t) => t.name !== name));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const entry = addEntry({ title: title.trim(), body, tags, imageIds: [] });
    navigate(`/entry/${entry.id}`);
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h1>New Entry</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <input
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
        </div>
        <div>
          <textarea
            placeholder="Write in markdown..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            style={{ width: "100%", marginBottom: "0.5rem" }}
          />
        </div>
        <div style={{ marginBottom: "0.5rem" }}>
          <input
            type="text"
            placeholder="Add tag (max 5)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                selectTag(tagInput);
              }
            }}
            disabled={tags.length >= 5}
          />
          <button type="button" onClick={() => selectTag(tagInput)} disabled={tags.length >= 5}>
            Add
          </button>
          {suggestions.length > 0 && (
            <ul style={{ listStyle: "none", padding: "0.25rem 0", margin: 0, fontSize: "0.85rem" }}>
              {suggestions.map((t) => (
                <li
                  key={t.name}
                  style={{ cursor: "pointer", padding: "0.15rem 0" }}
                  onClick={() => selectTag(t.name)}
                >
                  #{t.name}
                </li>
              ))}
            </ul>
          )}
          <div style={{ marginTop: "0.25rem" }}>
            {tags.map((t) => (
              <span key={t.name} style={{ marginRight: "0.5rem" }}>
                #{t.name}{" "}
                <button type="button" onClick={() => removeTag(t.name)} style={{ cursor: "pointer" }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
        <button type="submit" disabled={!title.trim()}>
          Save
        </button>
        <button type="button" onClick={() => navigate("/")} style={{ marginLeft: "0.5rem" }}>
          Cancel
        </button>
      </form>
    </div>
  );
}
