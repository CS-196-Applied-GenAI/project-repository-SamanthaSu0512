import { useState, useEffect, useCallback } from 'react';
import { getJson } from '../api';
import { useAuth } from '../auth/AuthContext';
import ProfileView from '../components/ProfileView';
import styles from './Profile.module.css';

export default function Profile() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [tweetsLoading, setTweetsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUser = useCallback(() => {
    if (!currentUser) return;
    setUserLoading(true);
    setError(null);
    getJson('/api/users/me')
      .then(setUser)
      .catch((err) => setError(err.message || 'Failed to load profile'))
      .finally(() => setUserLoading(false));
  }, [currentUser]);

  const fetchTweets = useCallback(() => {
    if (!currentUser) return;
    setTweetsLoading(true);
    getJson('/api/users/me/tweets?limit=5')
      .then((data) => setTweets(Array.isArray(data) ? data : []))
      .catch(() => setTweets([]))
      .finally(() => setTweetsLoading(false));
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) {
      setUserLoading(false);
      setTweetsLoading(false);
      return;
    }
    fetchUser();
  }, [currentUser, fetchUser]);

  useEffect(() => {
    if (!currentUser) return;
    fetchTweets();
  }, [currentUser, fetchTweets]);

  if (authLoading || userLoading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (error) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.error} role="alert">{error}</p>
      </div>
    );
  }

  if (!user) return null;

  return (
    <ProfileView
      user={user}
      tweets={tweets}
      loading={tweetsLoading}
      isOwnProfile
      onTweetsUpdate={fetchTweets}
    />
  );
}
