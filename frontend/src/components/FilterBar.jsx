import React from "react";
import "../styles/FilterBar.css";

const FILTERS = [
  { key: "all", label: "All" },
  { key: "open", label: "Open" },
  { key: "completed", label: "Done" },
];

const CATEGORIES = ["all", "personal", "work", "health", "other"];

function FilterBar({ filter, setFilter, categoryFilter, setCategoryFilter }) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`filter-btn ${filter === f.key ? "active" : ""}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="filter-divider" />
      <div className="filter-group category-filter">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            className={`filter-btn filter-cat ${categoryFilter === c ? "active" : ""}`}
            onClick={() => setCategoryFilter(c)}
          >
            {c === "all" ? "All Categories" : c}
          </button>
        ))}
      </div>
    </div>
  );
}

export default FilterBar;
