// types
import type { Tag } from "../types/Tag";

// components
import TagFilter from "./TagFilter";
import DateFilter from "./DateFilter";

interface FilterPanelProps {
  tags: Tag[];
  selectedTags: string[];
  onTagsChange: (selected: string[]) => void;
  years: number[];
  selectedYear: string;
  selectedMonth: string;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
}

export default function FilterPanel({
  tags, selectedTags, onTagsChange,
  years, selectedYear, selectedMonth, onYearChange, onMonthChange,
}: FilterPanelProps) {
  return (
    <div className="filter-panel">
      {tags.length > 0 && (
        <TagFilter tags={tags} selected={selectedTags} onChange={onTagsChange} />
      )}
      <DateFilter
        years={years}
        selectedYear={selectedYear}
        selectedMonth={selectedMonth}
        onYearChange={onYearChange}
        onMonthChange={onMonthChange}
      />
    </div>
  );
}
