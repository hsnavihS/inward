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
    <div>
      <h1>New Entry</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          autoFocus
        />
        <textarea
          placeholder="write in markdown..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
        />
        <div>
          <div className="tag-input-row">
            <input
              type="text"
              placeholder="add tag (max 5)"
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
              add
            </button>
          </div>
          {suggestions.length > 0 && (
            <ul className="tag-suggestions">
              {suggestions.map((t) => (
                <li key={t.name} onClick={() => selectTag(t.name)}>
                  #{t.name}
                </li>
              ))}
            </ul>
          )}
          {tags.length > 0 && (
            <div className="selected-tags">
              {tags.map((t) => (
                <span key={t.name}>
                  <span className="tag">#{t.name}</span>
                  <button type="button" onClick={() => removeTag(t.name)}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="action-bar">
          <button type="submit" disabled={!title.trim()}>save</button>
          <button type="button" onClick={() => navigate("/")}>cancel</button>
        </div>
      </form>
    </div>
  );
}
