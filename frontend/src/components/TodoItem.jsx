import React, { useState } from "react";
import "../styles/TodoItem.css";

const CATEGORY_EMOJI = {
  personal: "🏠",
  work: "💼",
  health: "🏃",
  other: "📌",
};

const PRIORITY_LABEL = {
  low: "Low",
  medium: "Med",
  high: "High",
};

function TodoItem({ todo, onToggle, onDelete }) {
  const [removing, setRemoving] = useState(false);

  const handleDelete = () => {
    setRemoving(true);
    setTimeout(() => onDelete(todo.id), 300);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className={`todo-item ${todo.completed ? "completed" : ""} ${removing ? "removing" : ""}`}>
      <button
        className={`todo-check ${todo.completed ? "checked" : ""}`}
        onClick={() => onToggle(todo.id)}
        aria-label={todo.completed ? "Mark incomplete" : "Mark complete"}
      >
        {todo.completed && <span className="check-mark">✓</span>}
      </button>

      <div className="todo-body">
        <span className="todo-title">{todo.title}</span>
        {todo.description && (
          <span className="todo-desc">{todo.description}</span>
        )}
        <div className="todo-meta">
          <span className="meta-badge meta-category">
            {CATEGORY_EMOJI[todo.category] || "📌"} {todo.category}
          </span>
          <span className={`meta-badge meta-priority priority-${todo.priority}`}>
            {PRIORITY_LABEL[todo.priority]}
          </span>
          <span className="meta-date">{formatDate(todo.createdAt)}</span>
        </div>
      </div>

      <button className="todo-delete" onClick={handleDelete} aria-label="Delete task">
        ✕
      </button>
    </div>
  );
}

export default TodoItem;
