import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import TodoForm from "./components/TodoForm";
import FilterBar from "./components/FilterBar";
import TodoList from "./components/TodoList";
import seedData from "./data/todos.json";
import "./styles/global.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

function App() {
  const [todos, setTodos] = useState([]);
  const [filter, setFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Try to load from backend; fall back to seed JSON
  useEffect(() => {
    fetch(`${API_BASE}/todos`)
      .then((res) => {
        if (!res.ok) throw new Error("Backend not available");
        return res.json();
      })
      .then((data) => {
        setTodos(data);
        setLoading(false);
      })
      .catch(() => {
        // Fallback: use the bundled JSON seed data
        setTodos(seedData);
        setLoading(false);
      });
  }, []);

  const handleAdd = async (newTodo) => {
    // Optimistic UI update
    setTodos((prev) => [newTodo, ...prev]);

    try {
      const res = await fetch(`${API_BASE}/todos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTodo),
      });
      if (res.ok) {
        const saved = await res.json();
        setTodos((prev) =>
          prev.map((t) => (t.id === newTodo.id ? saved : t))
        );
      }
    } catch {
      // Keep the optimistic result if backend is unavailable
    }
  };

  const handleToggle = async (id) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );

    try {
      const todo = todos.find((t) => t.id === id);
      await fetch(`${API_BASE}/todos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !todo.completed }),
      });
    } catch {
      // Optimistic update stands
    }
  };

  const handleDelete = async (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));

    try {
      await fetch(`${API_BASE}/todos/${id}`, { method: "DELETE" });
    } catch {
      // Optimistic update stands
    }
  };

  const filtered = todos.filter((t) => {
    const statusMatch =
      filter === "all" ||
      (filter === "open" && !t.completed) ||
      (filter === "completed" && t.completed);
    const categoryMatch =
      categoryFilter === "all" || t.category === categoryFilter;
    return statusMatch && categoryMatch;
  });

  const stats = {
    total: todos.length,
    open: todos.filter((t) => !t.completed).length,
    completed: todos.filter((t) => t.completed).length,
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "80px", color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="app-container">
      <Header {...stats} />
      <TodoForm onAdd={handleAdd} />
      <FilterBar
        filter={filter}
        setFilter={setFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
      />
      <TodoList todos={filtered} onToggle={handleToggle} onDelete={handleDelete} />
    </div>
  );
}

export default App;
