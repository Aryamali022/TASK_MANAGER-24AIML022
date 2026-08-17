// Presentational component: it only shows what it is given via props.
function Header({ total, done }) {
  return (
    <header className="header">
      <h1>Task Manager</h1>
      <p className="subtitle">
        {done} of {total} tasks completed
      </p>
    </header>
  );
}

export default Header;
