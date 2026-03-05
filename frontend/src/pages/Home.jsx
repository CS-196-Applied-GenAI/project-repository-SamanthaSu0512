import { useState, useEffect, useCallback } from 'react';
import { getJson } from '../api';
import { useAuth } from '../auth/AuthContext';
import TweetCard from '../components/TweetCard';
import styles from './Home.module.css';

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState(null);

  const refetchFeed = useCallback(() => {
    if (!user) return;
    getJson('/api/feed')
      .then(setFeed)
      .catch((err) => setFeedError(err.message || 'Failed to load feed'));
  }, [user]);

  useEffect(() => {
    if (!user) {
      setFeedLoading(false);
      return;
    }
    setFeedLoading(true);
    setFeedError(null);
    getJson('/api/feed')
      .then(setFeed)
      .catch((err) => setFeedError(err.message || 'Failed to load feed'))
      .finally(() => setFeedLoading(false));
  }, [user]);

  if (authLoading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (!user) {
    return <div className={styles.wrapper}><div className={styles.welcome}>Home page</div></div>;
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.welcome}>Welcome, {user.username}</div>

      {feedError && (
        <div className={styles.error} role="alert">{feedError}</div>
      )}

      {feedLoading && (
        <div className={styles.loading}>Loading feed…</div>
      )}

      {!feedLoading && !feedError && feed.length === 0 && (
        <div className={styles.empty}>No tweets yet.</div>
      )}

      {!feedLoading && !feedError && feed.length > 0 && (
        <ul className={styles.feedList}>
          {feed.map((tweet) => (
            <li key={tweet.id}>
              <TweetCard tweet={tweet} onUpdate={refetchFeed} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
