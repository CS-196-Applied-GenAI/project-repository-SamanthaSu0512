import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getJson, deleteJson } from '../api';
import styles from './Blocked.module.css';

function avatarSrc(profilePicture) {
  if (!profilePicture) return null;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return profilePicture.startsWith('http') ? profilePicture : base + profilePicture;
}

export default function Blocked() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unblockingId, setUnblockingId] = useState(null);

  const fetchBlocked = useCallback(() => {
    setLoading(true);
    setError(null);
    getJson('/api/users/me/blocks')
      .then((data) => setUsers(Array.isArray(data) ? data : []))
      .catch((err) => setError(err.message || 'Failed to load blocked users'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  async function handleUnblock(userId) {
    if (unblockingId) return;
    setUnblockingId(userId);
    try {
      await deleteJson(`/api/users/${userId}/block`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      setError('Failed to unblock');
    } finally {
      setUnblockingId(null);
    }
  }

  if (loading) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.loading}>Loading blocked users…</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Blocked users</h1>
      <p className={styles.subtitle}>
        Users you have blocked. They cannot see your posts or message you. You can unblock them below.
      </p>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      {users.length === 0 && !error && (
        <p className={styles.empty}>You haven’t blocked anyone.</p>
      )}

      {users.length > 0 && (
        <ul className={styles.list}>
          {users.map((u) => {
            const src = avatarSrc(u.profile_picture);
            return (
              <li key={u.id} className={styles.item}>
                <Link to={`/profile/${encodeURIComponent(u.username)}`} className={styles.userLink}>
                  <div className={styles.avatarWrap}>
                    {src ? (
                      <img src={src} alt="" className={styles.avatar} />
                    ) : (
                      <div className={styles.avatarPlaceholder} aria-hidden />
                    )}
                  </div>
                  <div className={styles.userInfo}>
                    <span className={styles.name}>{u.name || u.username || 'Unknown'}</span>
                    <span className={styles.username}>@{u.username}</span>
                  </div>
                </Link>
                <button
                  type="button"
                  className={styles.unblockBtn}
                  onClick={() => handleUnblock(u.id)}
                  disabled={unblockingId === u.id}
                >
                  {unblockingId === u.id ? 'Unblocking…' : 'Unblock'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
