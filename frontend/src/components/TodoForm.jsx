import React, { useState } from "react";
import "../styles/TodoForm.css";

const CATEGORIES = ["personal", "work", "health", "other"];
const PRIORITIES = ["low", "medium", "high"];

function TodoForm({ onAdd }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [category, setCategory] = useState("personal");
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTodo = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      completed: false,
      priority,
      category,
      createdAt: new Date().toISOString(),
    };

    onAdd(newTodo);
    setTitle("");
    setDescription("");
    setPriority("medium");
    setCategory("personal");
    setExpanded(false);
  };

  return (
    <form className="todo-form" onSubmit={handleSubmit}>
      <div className="form-main-row">
        <input
          className="form-input"
          type="text"
          placeholder="Add a new task…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setExpanded(true)}
        />
        <button className="btn-add" type="submit">
          <span>+</span>
        </button>
      </div>

      {expanded && (
        <div className="form-expanded">
          <textarea
            className="form-textarea"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div className="form-selects">
            <div className="select-group">
              <label>Priority</label>
              <div className="pill-group">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`pill pill-priority-${p} ${priority === p ? "active" : ""}`}
                    onClick={() => setPriority(p)}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div className="select-group">
              <label>Category</label>
              <div className="pill-group">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`pill pill-category ${category === c ? "active" : ""}`}
                    onClick={() => setCategory(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

export default TodoForm;
