import React from "react";
import "../styles/Header.css";

function Header({ total, open, completed }) {
  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="header-icon">✦</span>
        <h1 className="header-title">Tasky</h1>
      </div>
      <div className="header-stats">
        <div className="stat-chip stat-total">
          <span className="stat-num">{total}</span>
          <span className="stat-label">Total</span>
        </div>
        <div className="stat-chip stat-open">
          <span className="stat-num">{open}</span>
          <span className="stat-label">Open</span>
        </div>
        <div className="stat-chip stat-done">
          <span className="stat-num">{completed}</span>
          <span className="stat-label">Done</span>
        </div>
      </div>
    </header>
  );
}

export default Header;
