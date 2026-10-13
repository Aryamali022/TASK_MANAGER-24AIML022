import { memo } from 'react';

// Presentational component: it only shows what it is given via props.
function Header({ total, done, email, onLogout }) {
  return (
    <header className="header">
      <div className="header-row">
        <h1>Task Manager</h1>
        <button type="button" className="logout" onClick={onLogout}>
          Logout
        </button>
      </div>
      <p className="subtitle">
        {email} &middot; {done} of {total} tasks completed
      </p>
    </header>
  );
}

// memo: typing in the add-task form changes TaskPage state on every key,
// which used to re-render Header too even though none of its props changed
// (found with the React DevTools Profiler). memo skips those renders.
export default memo(Header);
