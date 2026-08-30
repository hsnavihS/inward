// react
import { useState, useRef, useEffect } from "react";
import type { ReactNode } from "react";

// routing
import { useNavigate } from "react-router-dom";

// context
import { useTheme } from "../context/ThemeContext";

const THEME_LABELS: Record<string, string> = { noir: "noir", blue: "blue", crimson: "crimson", ember: "ember", violet: "violet", forest: "forest" };

interface NavbarProps {
  left?: ReactNode;
}

export default function Navbar({ left }: NavbarProps) {
  const { theme, cycleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-section navbar-left">
        {left}
        <button onClick={() => navigate("/create")}>new</button>
      </div>
      <div className="navbar-section navbar-center">
        <p className="navbar-title" onClick={() => navigate("/")}>inward</p>
      </div>
      <div className="navbar-section navbar-right">
        <button onClick={cycleTheme} title="Switch theme">
          {`theme: ${THEME_LABELS[theme]}`}
        </button>
      </div>
    </nav>
  );
}

interface DropdownMenuProps {
  label: string;
  children: ReactNode;
}

export function DropdownMenu({ label, children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="dropdown" ref={ref}>
      <button onClick={() => setOpen(!open)}>{label}</button>
      {open && (
        <div className="dropdown-menu" onClick={() => setOpen(false)}>
          {children}
        </div>
      )}
    </div>
  );
}
