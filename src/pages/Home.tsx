// react
import { useState, useMemo } from "react";

// routing
import { Link } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";
import { useTags } from "../context/TagsContext";

// hooks
import { useDebounce } from "../hooks/useDebounce";

// components
import ConfirmModal from "../components/ConfirmModal";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";

export default function Home() {
  const { entries, loading, deleteEntry } = useEntries();
  const { tags } = useTags();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const years = useMemo(() => {
    const set = new Set(entries.map((e) => new Date(e.createdAt).getFullYear()));
    return Array.from(set).sort((a, b) => b - a);
  }, [entries]);

  const filtered = useMemo(() => {
    let result = [...entries];

    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((e) => e.title.toLowerCase().includes(q));
    }

    if (selectedTags.length > 0) {
      result = result.filter((e) =>
        selectedTags.some((st) => e.tags.some((t) => t.name === st))
      );
    }

    if (year) {
      const y = Number(year);
      result = result.filter((e) => new Date(e.createdAt).getFullYear() === y);
    }

    if (month) {
      const m = Number(month);
      result = result.filter((e) => new Date(e.createdAt).getMonth() === m);
    }

    result.sort((a, b) => b.createdAt - a.createdAt);
    return result;
  }, [entries, debouncedSearch, selectedTags, year, month]);

  if (loading) {
    return (
      <div>
        <div className="header">
          <h1>Inward</h1>
        </div>
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="header">
        <h1>Inward</h1>
        <Link to="/create">[ + new ]</Link>
      </div>

      {entries.length > 0 && (
        <>
          <div className="search-row">
            <SearchBar value={search} onChange={setSearch} />
            <button
              className={`filter-toggle${filtersOpen ? " active" : ""}`}
              onClick={() => setFiltersOpen(!filtersOpen)}
              title="Toggle filters"
            >▽</button>
          </div>

          {filtersOpen && (
            <FilterPanel
              tags={tags}
              selectedTags={selectedTags}
              onTagsChange={setSelectedTags}
              years={years}
              selectedYear={year}
              selectedMonth={month}
              onYearChange={setYear}
              onMonthChange={setMonth}
            />
          )}

          <hr className="divider" />
        </>
      )}

      {entries.length === 0 ? (
        <p className="empty-state">No entries yet. Start writing.</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">No entries match your filters.</p>
      ) : (
        <ul>
          {filtered.map((e) => (
            <li key={e.id} className="entry-row">
              <Link to={`/entry/${e.id}`} style={{ borderBottom: "none", flex: 1 }}>
                <strong>{e.title}</strong>
                <span className="dim" style={{ marginLeft: "1rem", fontSize: "13px" }}>
                  {new Date(e.createdAt).toLocaleDateString()}
                </span>
              </Link>
              <button
                className="btn-danger btn-sm"
                onClick={() => setDeleteId(e.id)}
              >×</button>
              {e.tags.length > 0 && (
                <div style={{ marginTop: "6px", width: "100%" }}>
                  {e.tags.map((t) => (
                    <span key={t.name} className="tag">#{t.name}</span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {deleteId && (
        <ConfirmModal
          message="Delete this entry? This cannot be undone."
          onConfirm={() => { deleteEntry(deleteId); setDeleteId(null); }}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
}
