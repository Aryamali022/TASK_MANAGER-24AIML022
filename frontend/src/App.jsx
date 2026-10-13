import { useState, useCallback, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './page/auth';
import TaskPage from './page/task';
import NavBar from './components/navbar';
import PageLoader from './components/pageloader';
import './App.css';

// Route-based code splitting.
// TaskPage is the landing page, so it stays in the main bundle (lazy-loading
// it would only add an extra request before the first screen appears).
// The other pages are split into their own chunks and downloaded the first
// time the user navigates to them.

const ProjectsPage = lazy(() => import('./page/projects'));
const StatsPage = lazy(() => import('./page/stats'));
const ContactPage = lazy(() => import('./page/contact'));

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

  // useCallback keeps the same function between renders, so pages that list
  // onLogout in a useEffect dependency array do not refetch for no reason.
  const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('email');
    setToken('');
    setEmail('');
  }, []);

  // No token -> login screen. Token -> the routed app.
  if (!token) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <BrowserRouter>
      <NavBar />
      {/* While a lazy page's chunk is downloading, Suspense shows the fallback. */}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<TaskPage token={token} email={email} onLogout={handleLogout} />} />
          <Route path="/projects" element={<ProjectsPage token={token} onLogout={handleLogout} />} />
          <Route path="/stats" element={<StatsPage token={token} onLogout={handleLogout} />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
