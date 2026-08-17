// Shows the list of tasks.
// It does not fetch anything itself - the parent passes the data down (props)
// and passes callbacks (onToggle / onDelete) that the parent will run.
function TaskList({ tasks, onToggle, onDelete }) {
  if (tasks.length === 0) {
    return <p className="empty">No tasks yet. Add your first one above.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        // key must be unique - MongoDB gives every document an _id
        <li key={task._id} className={task.completed ? 'task done' : 'task'}>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggle(task)}
          />

          <div className="task-text">
            <strong>{task.title}</strong>
            <span>{task.description}</span>
          </div>

          <button className="delete-btn" onClick={() => onDelete(task._id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

export default TaskList;
