import { useState, useEffect } from 'react';
import { api } from '../api';

// Board view of the same tasks: one column for "To do", one for "Done".
// This page is lazy-loaded, so its code is only downloaded when the user
// visits /projects for the first time.
function ProjectsPage({ token, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/tasks', { token })
      .then(setTasks)
      .catch((err) => (err.status === 401 ? onLogout() : setError(err.message)));
  }, [token, onLogout]);

  const todo = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  return (
    <div className="container">
      <h1>Projects board</h1>
      {error && <p className="error">{error}</p>}

      <div className="board">
        <Column title="To do" tasks={todo} />
        <Column title="Done" tasks={done} />
      </div>
    </div>
  );
}

function Column({ title, tasks }) {
  return (
    <section className="column">
      <h2>
        {title} <span className="count">{tasks.length}</span>
      </h2>
      {tasks.length === 0 && <p className="empty">Nothing here.</p>}
      {tasks.map((task) => (
        <div key={task._id} className="card">
          <strong>{task.title}</strong>
          <span>{task.description}</span>
        </div>
      ))}
    </section>
  );
}

export default ProjectsPage;
