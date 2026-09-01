import { useState, useEffect } from 'react';
import Header from '../components/header';
import TaskList from '../components/tasklist';
import { api } from '../api';

// The task screen. It only renders once we have a token.
// Every request below passes that token, which the backend's auth
// middleware checks before the route runs.
function TaskPage({ token, email, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  // If the token has expired the backend answers 401, and we log out so the
  // user sees the login screen instead of a dead page.
  function handleError(err) {
    if (err.status === 401) {
      onLogout();
    } else {
      setError(err.message);
    }
  }

  // Read this user's tasks and put them into state.
  // Every change below calls this again, so the screen always matches the database.
  async function loadTasks() {
    try {
      const data = await api('/tasks', { token });
      setTasks(data);
      setError('');
    } catch (err) {
      handleError(err);
    }
  }

  // The empty [] means: run this once, after the first render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTasks();
    // loadTasks is intentionally left out: adding it would re-run this on
    // every render, because the function is recreated each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Add ---------------------------------------------------------------
  async function addTask(e) {
    e.preventDefault(); // stop the browser from reloading the page

    if (!title.trim() || !description.trim()) {
      setError('Please fill in both fields');
      return;
    }

    try {
      await api('/tasks', {
        method: 'POST',
        body: { title, description },
        token,
      });
      setTitle('');
      setDescription('');
      loadTasks();
    } catch (err) {
      handleError(err);
    }
  }

  // ---- Tick / untick -----------------------------------------------------
  async function toggleTask(task) {
    try {
      await api(`/tasks/${task._id}`, {
        method: 'PUT',
        body: { completed: !task.completed },
        token,
      });
      loadTasks();
    } catch (err) {
      handleError(err);
    }
  }

  // ---- Delete ------------------------------------------------------------
  async function removeTask(id) {
    try {
      await api(`/tasks/${id}`, { method: 'DELETE', token });
      loadTasks();
    } catch (err) {
      handleError(err);
    }
  }

  const doneCount = tasks.filter((t) => t.completed).length;

  return (
    <div className="container">
      <Header
        total={tasks.length}
        done={doneCount}
        email={email}
        onLogout={onLogout}
      />

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
