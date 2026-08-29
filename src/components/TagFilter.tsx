// react
import { useState, useRef, useEffect, useCallback } from "react";

// types
import type { Tag } from "../types/Tag";

interface TagFilterProps {
  tags: Tag[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export default function TagFilter({ tags, selected, onChange }: TagFilterProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);
  const [expanded, setExpanded] = useState(false);

  const measureFirstRow = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const children = Array.from(container.children) as HTMLElement[];
    if (children.length === 0) return;

    const firstTop = children[0].offsetTop;
    let count = 0;
    for (const child of children) {
      // skip the toggle button (last child) during measurement
      if (child.classList.contains("tag-toggle")) break;
      if (child.offsetTop !== firstTop) break;
      count++;
    }
    setVisibleCount(count);
  }, []);

  // re-measure when tags change or on resize
  useEffect(() => {
    measureFirstRow();
    window.addEventListener("resize", measureFirstRow);
    return () => window.removeEventListener("resize", measureFirstRow);
  }, [tags, measureFirstRow]);

  const toggle = (name: string) => {
    onChange(
      selected.includes(name)
        ? selected.filter((s) => s !== name)
        : [...selected, name]
    );
  };

  if (tags.length === 0) return null;

  const hasOverflow = visibleCount < tags.length;
  const displayTags = expanded ? tags : tags.slice(0, visibleCount);

  return (
    <div className="tag-filter" ref={containerRef}>
      {displayTags.map((t) => (
        <button
          key={t.name}
          className={`tag-pill${selected.includes(t.name) ? " selected" : ""}`}
          onClick={() => toggle(t.name)}
        >#{t.name}</button>
      ))}
      {hasOverflow && (
        <button
          className={`tag-pill tag-toggle${expanded ? " active" : ""}`}
          onClick={() => setExpanded(!expanded)}
        >{expanded ? "▲" : "▼"}</button>
      )}
    </div>
  );
}
