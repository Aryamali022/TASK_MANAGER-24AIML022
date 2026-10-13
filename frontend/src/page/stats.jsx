import { useState, useEffect, lazy, Suspense } from 'react';
import { api } from '../api';
import PageLoader from '../components/pageloader';

// recharts is a heavy third-party library. Importing the chart lazily means
// recharts is put in its own chunk and is only downloaded when this page
// actually renders the chart - the Tasks, Projects and Contact pages never
// pay for it.

const TaskChart = lazy(() => import('../components/taskchart'));

function StatsPage({ token, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api('/tasks', { token })
      .then(setTasks)
      .catch((err) => (err.status === 401 ? onLogout() : setError(err.message)));
  }, [token, onLogout]);

  const done = tasks.filter((t) => t.completed).length;

  return (
    <div className="container">
      <h1>Statistics</h1>
      <p className="subtitle">
        {done} completed &middot; {tasks.length - done} pending
      </p>
      {error && <p className="error">{error}</p>}

      <Suspense fallback={<PageLoader text="Loading chart..." />}>
        <TaskChart done={done} pending={tasks.length - done} />
      </Suspense>
    </div>
  );
}

export default StatsPage;
