// react
import { useState, useMemo } from "react";

// routing
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const ENTRIES_PER_PAGE = 5;

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

  // Derive pagination from filtered results
  const totalPages = Math.max(1, Math.ceil(filtered.length / ENTRIES_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * ENTRIES_PER_PAGE, safePage * ENTRIES_PER_PAGE);

  // Reset to page 1 when filters change
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };
  const handleTagsChange = (tags: string[]) => {
    setSelectedTags(tags);
    setPage(1);
  };
  const handleYearChange = (y: string) => {
    setYear(y);
    setPage(1);
  };
  const handleMonthChange = (m: string) => {
    setMonth(m);
    setPage(1);
  };

  if (loading) {
    return (
      <div>
        {renderHeader()}
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  function renderHeader() {
    return (
      <div className="header">
        <h1>Inward</h1>
        <button onClick={() => navigate("/create")}>new</button>
      </div>
    );
  }

  function renderSearchAndFilters() {
    if (entries.length === 0) return null;
    return (
      <>
        <div className="search-row">
          <SearchBar value={search} onChange={handleSearch} />
          <button
            className={`filter-toggle${filtersOpen ? " active" : ""}`}
            onClick={() => setFiltersOpen(!filtersOpen)}
            title="Toggle filters"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        </div>

        {filtersOpen && (
          <FilterPanel
            tags={tags}
            selectedTags={selectedTags}
            onTagsChange={handleTagsChange}
            years={years}
            selectedYear={year}
            selectedMonth={month}
            onYearChange={handleYearChange}
            onMonthChange={handleMonthChange}
          />
        )}

        <hr className="divider" />
      </>
    );
  }

  function renderEntryList() {
    if (entries.length === 0) {
      return <p className="empty-state">No entries yet. Start writing.</p>;
    }
    if (paged.length === 0) {
      return <p className="empty-state">No entries match your filters.</p>;
    }
    return (
      <ul>
        {paged.map((e) => (
          <li key={e.id} className="entry-row" onClick={() => navigate(`/entry/${e.id}`)} style={{ cursor: "pointer" }}>
            <div style={{ flex: 1 }}>
              <strong>{e.title}</strong>
              <span className="dim" style={{ marginLeft: "1rem", fontSize: "13px" }}>
                {new Date(e.createdAt).toLocaleDateString()}
              </span>
            </div>
            <button
              className="btn-danger btn-sm"
              onClick={(ev) => { ev.stopPropagation(); setDeleteId(e.id); }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
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
    );
  }

  function renderPagination() {
    if (entries.length === 0) return null;
    return (
      <div className="pagination">
        <button onClick={() => setPage(safePage - 1)} disabled={safePage === 1}>
          {"previous"}
        </button>
        <span>page {safePage} of {totalPages}</span>
        <button onClick={() => setPage(safePage + 1)} disabled={safePage === totalPages}>
          {"next"}
        </button>
      </div>
    );
  }

  return (
    <div>
      {renderHeader()}
      {renderSearchAndFilters()}
      {renderEntryList()}
      {renderPagination()}

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
