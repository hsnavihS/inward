// react
import { useState, useMemo, useCallback, useRef } from "react";

// routing
import { useNavigate, useSearchParams } from "react-router-dom";

// context
import { useEntries } from "../context/EntriesContext";
import { useTags } from "../context/TagsContext";
import { useTheme } from "../context/ThemeContext";
import { useVault } from "../context/VaultContext";

// hooks
import { useDebounce } from "../hooks/useDebounce";

// components
import ConfirmModal from "../components/ConfirmModal";
import SearchBar from "../components/SearchBar";
import FilterPanel from "../components/FilterPanel";

// utilities
import { exportBackup, importBackup } from "../backup";
import { pushAllEntries, pushTags } from "../sync";

export default function Home() {
  const THEME_LABELS = { crt: "crt", sakura: "sakura", blue: "blue", crimson: "crimson" };

  const { entries, loading, deleteEntry, replaceEntries } = useEntries();
  const { tags, replaceTags } = useTags();
  const { theme, cycleTheme } = useTheme();
  const { key, vaultId } = useVault();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [importError, setImportError] = useState("");
  const [syncing, setSyncing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);

  // pagination — read from query param, default to 1
  const page = Number(searchParams.get("page")) || 1;
  const ENTRIES_PER_PAGE = 10;

  const setPage = useCallback((p: number) => {
    if (p <= 1) {
      searchParams.delete("page");
    } else {
      searchParams.set("page", String(p));
    }
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

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

  const handleExport = async () => {
    try {
      await exportBackup(key, vaultId);
    } catch (err) {
      console.error("Export failed:", err);
    }
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await pushAllEntries(vaultId, entries, key);
      await pushTags(vaultId, tags, key);
    } catch (err) {
      console.error("Sync failed:", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    try {
      const result = await importBackup(file, key, vaultId);
      replaceEntries(result.entries);
      replaceTags(result.tags);
    } catch (err) {
      setImportError((err as Error).message);
    }
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  if (loading) {
    return (
      <div>
        {renderHeader()}
        {importError && <p className="error">{importError}</p>}
        <p className="empty-state">Loading...</p>
      </div>
    );
  }

  function renderHeader() {
    return (
      <div className="header">
        <h1>Inward</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={handleExport} title="Export backup">export</button>
          <button onClick={() => fileInputRef.current?.click()} title="Import backup">import</button>
          <button onClick={handleSyncAll} disabled={syncing} title="Sync all to cloud">
            {syncing ? "syncing..." : "sync"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".inw"
            style={{ display: "none" }}
            onChange={handleImport}
          />
          <button onClick={cycleTheme} title="Switch theme">
            {`theme: ${THEME_LABELS[theme]}`}
          </button>
          <button onClick={() => navigate("/create")}>new</button>
        </div>
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
      {importError && <p className="error">{importError}</p>}
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
