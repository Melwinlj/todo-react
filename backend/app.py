from flask import Flask, jsonify, request, abort
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database config — uses DATABASE_URL env var (PostgreSQL on Railway) or local SQLite
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get(
    "DATABASE_URL", "sqlite:///todos.db"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db = SQLAlchemy(app)


# ── Model ───────────────────────────────────────────────────────────────────

class Todo(db.Model):
    __tablename__ = "todos"

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default="")
    completed = db.Column(db.Boolean, default=False)
    priority = db.Column(db.String(20), default="medium")   # low | medium | high
    category = db.Column(db.String(50), default="personal") # personal | work | health | other
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "completed": self.completed,
            "priority": self.priority,
            "category": self.category,
            "createdAt": self.created_at.isoformat() + "Z",
        }


# ── Seed helper ─────────────────────────────────────────────────────────────

def seed_from_json():
    """Populate the DB with todos.json if the table is empty."""
    import json, pathlib
    json_path = pathlib.Path(__file__).parent / "todos.json"
    if not json_path.exists():
        return
    if Todo.query.count() > 0:
        return
    with open(json_path) as f:
        items = json.load(f)
    for item in items:
        todo = Todo(
            title=item["title"],
            description=item.get("description", ""),
            completed=item.get("completed", False),
            priority=item.get("priority", "medium"),
            category=item.get("category", "personal"),
        )
        db.session.add(todo)
    db.session.commit()


# ── Routes ──────────────────────────────────────────────────────────────────

@app.route("/todos", methods=["GET"])
def get_todos():
    todos = Todo.query.order_by(Todo.created_at.desc()).all()
    return jsonify([t.to_dict() for t in todos])


@app.route("/todos", methods=["POST"])
def create_todo():
    data = request.get_json()
    if not data or not data.get("title"):
        abort(400, description="Title is required")
    todo = Todo(
        title=data["title"].strip(),
        description=data.get("description", "").strip(),
        completed=data.get("completed", False),
        priority=data.get("priority", "medium"),
        category=data.get("category", "personal"),
    )
    db.session.add(todo)
    db.session.commit()
    return jsonify(todo.to_dict()), 201


@app.route("/todos/<int:todo_id>", methods=["PUT"])
def update_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    data = request.get_json()
    if "title" in data:
        todo.title = data["title"].strip()
    if "description" in data:
        todo.description = data["description"].strip()
    if "completed" in data:
        todo.completed = data["completed"]
    if "priority" in data:
        todo.priority = data["priority"]
    if "category" in data:
        todo.category = data["category"]
    db.session.commit()
    return jsonify(todo.to_dict())


@app.route("/todos/<int:todo_id>", methods=["DELETE"])
def delete_todo(todo_id):
    todo = Todo.query.get_or_404(todo_id)
    db.session.delete(todo)
    db.session.commit()
    return jsonify({"deleted": True})


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# ── Main ────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        seed_from_json()
    app.run(host="0.0.0.0", port=5000, debug=True)
