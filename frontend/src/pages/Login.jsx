import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postJson } from '../api';
import { useAuth } from '../auth/AuthContext';
import styles from './Login.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const body = loginId.includes('@')
        ? { email: loginId, password }
        : { username: loginId, password };
      const data = await postJson('/api/auth/login', body);
      setUser(data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Log in</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Username or email
          <input
            type="text"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            autoComplete="username"
            required
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className={styles.input}
          />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" disabled={submitting} className={styles.button}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className={styles.footer}>
        Don&apos;t have an account? <Link to="/signup" className={styles.link}>Sign up</Link>
      </p>
    </div>
  );
}
