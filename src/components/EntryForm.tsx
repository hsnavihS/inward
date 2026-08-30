// react
import { useState, useRef } from "react";

// types
import type { Tag } from "../types/Tag";

// context
import { useTags } from "../context/TagsContext";

// components
import ReactMarkdown from "react-markdown";

// utilities
import { uploadImage, isCloudinaryConfigured } from "../cloudinary";

interface PendingImage {
  file: File;
  previewUrl: string;
}

interface EntryFormProps {
  initialTitle?: string;
  initialBody?: string;
  initialTags?: Tag[];
  initialImages?: string[];
  onSubmit: (data: { title: string; body: string; tags: Tag[]; images: string[] }) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export default function EntryForm({
  initialTitle = "",
  initialBody = "",
  initialTags = [],
  initialImages = [],
  onSubmit,
  onCancel,
  submitLabel = "save",
}: EntryFormProps) {
  const { addTag, searchTags } = useTags();

  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [existingImages, setExistingImages] = useState<string[]>(initialImages);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [preview, setPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalImages = existingImages.length + pendingImages.length;

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || totalImages >= 3) return;
    const previewUrl = URL.createObjectURL(file);
    setPendingImages([...pendingImages, { file, previewUrl }]);
    e.target.value = "";
  };

  const removeExistingImage = (index: number) =>
    setExistingImages(existingImages.filter((_, i) => i !== index));

  const removePendingImage = (index: number) => {
    const removed = pendingImages[index];
    URL.revokeObjectURL(removed.previewUrl);
    setPendingImages(pendingImages.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    setUploadError("");

    try {
      // Upload pending files now
      const uploadedUrls: string[] = [];
      for (const pending of pendingImages) {
        const url = await uploadImage(pending.file);
        uploadedUrls.push(url);
      }

      // Clean up preview URLs
      pendingImages.forEach((p) => URL.revokeObjectURL(p.previewUrl));

      const allImages = [...existingImages, ...uploadedUrls];
      onSubmit({ title: title.trim(), body, tags, images: allImages });
    } catch (err) {
      setUploadError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
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
      {isCloudinaryConfigured && (
        <div className="image-attach">
          <div className="tag-input-row">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={totalImages >= 3 || submitting}
            >
              {`attach image (${totalImages}/3)`}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileSelect}
            />
          </div>
          {uploadError && <p className="error">{uploadError}</p>}
          {(existingImages.length > 0 || pendingImages.length > 0) && (
            <div className="image-preview-strip">
              {existingImages.map((url, i) => (
                <div key={url} className="image-preview-thumb">
                  <img src={url} alt={`attachment ${i + 1}`} />
                  <button type="button" className="btn-danger btn-sm" onClick={() => removeExistingImage(i)}>×</button>
                </div>
              ))}
              {pendingImages.map((p, i) => (
                <div key={p.previewUrl} className="image-preview-thumb">
                  <img src={p.previewUrl} alt={`pending ${i + 1}`} />
                  <button type="button" className="btn-danger btn-sm" onClick={() => removePendingImage(i)}>×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      <div className="action-bar">
        <button type="submit" disabled={!title.trim() || !body.trim() || submitting}>
          {submitting ? "saving..." : submitLabel}
        </button>
        <button type="button" className="btn-danger" onClick={onCancel} disabled={submitting}>cancel</button>
      </div>
    </form>
  );
}
