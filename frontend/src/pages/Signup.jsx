import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { postJson } from '../api';
import { useAuth } from '../auth/AuthContext';
import styles from './Signup.module.css';

export default function Signup() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await postJson('/api/auth/signup', {
        username: username.trim(),
        email: email.trim(),
        password,
        name: name.trim() || undefined,
      });
      setUser(data);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message || 'Signup failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Create account</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            required
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
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
            autoComplete="new-password"
            required
            className={styles.input}
          />
        </label>
        <label className={styles.label}>
          Name <span className={styles.optional}>(optional)</span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className={styles.input}
          />
        </label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button type="submit" disabled={submitting} className={styles.button}>
          {submitting ? 'Creating account…' : 'Sign up'}
        </button>
      </form>
      <p className={styles.footer}>
        Already have an account? <Link to="/login" className={styles.link}>Log in</Link>
      </p>
    </div>
  );
}
