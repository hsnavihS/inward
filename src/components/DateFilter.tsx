interface DateFilterProps {
  years: number[];
  selectedYear: string;
  selectedMonth: string;
  onYearChange: (year: string) => void;
  onMonthChange: (month: string) => void;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function DateFilter({ years, selectedYear, selectedMonth, onYearChange, onMonthChange }: DateFilterProps) {
  return (
    <div className="date-filter">
      <select value={selectedYear} onChange={(e) => onYearChange(e.target.value)}>
        <option value="">all years</option>
        {years.map((y) => (
          <option key={y} value={y}>{y}</option>
        ))}
      </select>
      <select value={selectedMonth} onChange={(e) => onMonthChange(e.target.value)}>
        <option value="">all months</option>
        {MONTHS.map((m, i) => (
          <option key={m} value={i}>{m}</option>
        ))}
      </select>
    </div>
  );
}
