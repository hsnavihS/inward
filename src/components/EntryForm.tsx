// react
import { useState } from "react";

// types
import type { Tag } from "../types/Tag";

// context
import { useTags } from "../context/TagsContext";

// components
import ReactMarkdown from "react-markdown";

interface EntryFormProps {
  initialTitle?: string;
  initialBody?: string;
  initialTags?: Tag[];
  onSubmit: (data: { title: string; body: string; tags: Tag[] }) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function EntryForm({
  initialTitle = "",
  initialBody = "",
  initialTags = [],
  onSubmit,
  onCancel,
  submitLabel = "save",
}: EntryFormProps) {
  const { addTag, searchTags } = useTags();

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [preview, setPreview] = useState(false);

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
    onSubmit({ title: title.trim(), body, tags });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
      />
      <div className="editor-tabs">
        <button type="button" className={preview ? "" : "active"} onClick={() => setPreview(false)}>write</button>
        <button type="button" className={preview ? "active" : ""} onClick={() => setPreview(true)}>preview</button>
      </div>
      {preview ? (
        <div className="entry-body markdown-body preview-box">
          {body.trim() ? (
            <ReactMarkdown>{body}</ReactMarkdown>
          ) : (
            <p className="dim">Nothing to preview</p>
          )}
        </div>
      ) : (
        <textarea
          placeholder="write in markdown..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
        />
      )}
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
        <button type="submit" disabled={!title.trim() || !body.trim()}>{submitLabel}</button>
        <button type="button" className="btn-danger" onClick={onCancel}>cancel</button>
      </div>
    </form>
  );
}
