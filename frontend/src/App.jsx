import { useState } from 'react';
import AuthPage from './page/auth';
import TaskPage from './page/task';
import './App.css';

function App() {
  // The token is kept in localStorage so a page refresh does not log you out.
  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [email, setEmail] = useState(() => localStorage.getItem('email') || '');

  function handleLogin(newToken, newEmail) {
    localStorage.setItem('token', newToken);
    localStorage.setItem('email', newEmail);
    setToken(newToken);
    setEmail(newEmail);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setToken('');
    setEmail('');
  }

  // No token -> login screen. Token -> task screen.
  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return <TaskPage token={token} email={email} onLogout={handleLogout} />;
}

export default App;
