import React from "react";
import TodoItem from "./TodoItem";
import "../styles/TodoList.css";

function TodoList({ todos, onToggle, onDelete }) {
  if (todos.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">✦</span>
        <p>Nothing here yet — add a task above!</p>
      </div>
    );
  }

  return (
    <ul className="todo-list">
      {todos.map((todo) => (
        <li key={todo.id} className="todo-list-item">
          <TodoItem todo={todo} onToggle={onToggle} onDelete={onDelete} />
        </li>
      ))}
    </ul>
  );
}

export default TodoList;
