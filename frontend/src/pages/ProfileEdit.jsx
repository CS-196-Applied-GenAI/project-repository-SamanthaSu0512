import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getJson, patchJson } from '../api';
import { useAuth } from '../auth/AuthContext';
import styles from './ProfileEdit.module.css';

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user: currentUser, setUser } = useAuth();
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) return;
    getJson('/api/users/me')
      .then((user) => {
        setBio(user.bio ?? '');
        setUsername(user.username ?? '');
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setLoading(false));
  }, [currentUser]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const updated = await patchJson('/api/users/me', {
        bio: bio.trim() || undefined,
        username: username.trim() || undefined,
      });
      setUser?.(updated);
      navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Edit profile</h1>
      <p className={styles.subtitle}>Update your bio and username.</p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={styles.input}
            autoComplete="username"
          />
        </label>
        <label className={styles.label}>
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className={styles.textarea}
            rows={4}
            placeholder="Tell us about yourself"
          />
        </label>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancel}
            onClick={() => navigate('/profile')}
            disabled={saving}
          >
            Cancel
          </button>
          <button type="submit" className={styles.submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}
