import { useState, useEffect } from 'react';
import Header from '../components/header';
import TaskList from '../components/tasklist';

// Vite forwards "/tasks" to http://localhost:5000/tasks (see vite.config.js)
const API = '/tasks';

const SERVER_DOWN = 'Cannot reach the server. Is the backend running on port 5000?';

function TaskPage() {
  const [tasks, setTasks] = useState([]);   // the list from MongoDB
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // Read all tasks from the backend and put them into state.
  // Every change below calls this again, so the screen always matches the database.
  async function loadTasks() {
    try {
      const res = await fetch(API);
      const data = await res.json();
      setTasks(data);
      setError('');
    } catch {
      setError(SERVER_DOWN);
    }
  }

  // The empty [] means: run this once, after the first render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
  }, []);

  // ---- Add ---------------------------------------------------------------
  async function addTask(e) {
    e.preventDefault(); // stop the browser from reloading the page

    if (!title.trim() || !description.trim()) {
      setError('Please fill in both fields');
      return;
    }

    try {
      await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });
      setTitle('');
      setDescription('');
      loadTasks();
    } catch {
      setError(SERVER_DOWN);
    }
  }

  // ---- Tick / untick -----------------------------------------------------
  async function toggleTask(task) {
    try {
      await fetch(`${API}/${task._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: !task.completed }),
      });
      loadTasks();
    } catch {
      setError(SERVER_DOWN);
    }
  }

  // ---- Delete ------------------------------------------------------------
  async function removeTask(id) {
    try {
      await fetch(`${API}/${id}`, { method: 'DELETE' });
      loadTasks();
    } catch {
      setError(SERVER_DOWN);
    }
  }

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="container">
      <Header total={tasks.length} done={doneCount} />

      <form className="task-form" onSubmit={addTask}>
        <input
          type="text"
          placeholder="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <button type="submit">Add Task</button>
      </form>

      {error && <p className="error">{error}</p>}

      <TaskList tasks={tasks} onToggle={toggleTask} onDelete={removeTask} />
    </div>
  );
}

export default TaskPage;
