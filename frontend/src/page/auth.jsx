import { useState } from 'react';
import { api } from '../api';

// The login / register screen. Shown whenever we do not have a token.
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const isRegister = mode === 'register';

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    try {
      // Registering does not return a token, so we register first and then
      // log in with the same details.
      if (isRegister) {
        await api('/register', { method: 'POST', body: { email, password } });
      }

      const data = await api('/login', {
        method: 'POST',
        body: { email, password },
      });

      // Hand the token up to App, which stores it and swaps the screen.
      onLogin(data.token, data.email);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="container narrow">
      <h1>{isRegister ? 'Create account' : 'Login'}</h1>

      <form className="auth-form" onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password (min 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>

      {error && <p className="error">{error}</p>}

      <p className="switch">
        {isRegister ? 'Already have an account?' : 'No account yet?'}{' '}
        <button
          type="button"
          className="link"
          onClick={() => {
            setMode(isRegister ? 'login' : 'register');
            setError('');
          }}
        >
          {isRegister ? 'Login instead' : 'Register instead'}
        </button>
      </p>
    </div>
  );
}

export default AuthPage;
