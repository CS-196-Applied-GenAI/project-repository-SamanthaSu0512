import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getJson, postJson, deleteJson } from '../api';
import { useAuth } from '../auth/AuthContext';
import ProfileView from '../components/ProfileView';
import styles from './ProfileByUsername.module.css';

export default function ProfileByUsername() {
  const { username } = useParams();
  const { user: currentUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [tweets, setTweets] = useState([]);
  const [userLoading, setUserLoading] = useState(true);
  const [tweetsLoading, setTweetsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [following, setFollowing] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [blockLoading, setBlockLoading] = useState(false);

  const isOwnProfile = currentUser && user && currentUser.id === user.id;

  const fetchUser = useCallback(() => {
    if (!username || !currentUser) return;
    setUserLoading(true);
    setError(null);
    getJson(`/api/users/${encodeURIComponent(username)}`)
      .then(setUser)
      .catch((err) => {
        setError(err.status === 404 ? 'User not found' : err.message || 'Failed to load profile');
        setUser(null);
      })
      .finally(() => setUserLoading(false));
  }, [username, currentUser]);

  const fetchTweets = useCallback(() => {
    if (!username || !currentUser) return;
    setTweetsLoading(true);
    getJson(`/api/users/${encodeURIComponent(username)}/tweets?limit=5`)
      .then((data) => setTweets(Array.isArray(data) ? data : []))
      .catch(() => setTweets([]))
      .finally(() => setTweetsLoading(false));
  }, [username, currentUser]);

  useEffect(() => {
    if (!currentUser || !username) {
      setUserLoading(false);
      setTweetsLoading(false);
      return;
    }
    fetchUser();
  }, [currentUser, username, fetchUser]);

  useEffect(() => {
    if (!user || !username) return;
    fetchTweets();
  }, [user, username, fetchTweets]);

  async function handleFollow() {
    if (!user?.id || followLoading) return;
    setFollowLoading(true);
    try {
      await postJson(`/api/users/${user.id}/follow`);
      setFollowing(true);
    } catch {
      // keep state on error
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleUnfollow() {
    if (!user?.id || followLoading) return;
    setFollowLoading(true);
    try {
      await deleteJson(`/api/users/${user.id}/follow`);
      setFollowing(false);
    } catch {
      // keep state on error
    } finally {
      setFollowLoading(false);
    }
  }

  async function handleBlock() {
    if (!user?.id || blockLoading) return;
    setBlockLoading(true);
    try {
      await postJson(`/api/users/${user.id}/block`);
      setBlocking(true);
    } catch {
      // keep state on error
    } finally {
      setBlockLoading(false);
    }
  }

  async function handleUnblock() {
    if (!user?.id || blockLoading) return;
    setBlockLoading(true);
    try {
      await deleteJson(`/api/users/${user.id}/block`);
      setBlocking(false);
    } catch {
      // keep state on error
    } finally {
      setBlockLoading(false);
    }
  }

  if (authLoading) {
    return <div className={styles.loading}>Loading…</div>;
  }

  if (!currentUser) return null;

  if (userLoading && !user) {
    return <div className={styles.loading}>Loading profile…</div>;
  }

  if (error && !user) {
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
      isOwnProfile={isOwnProfile}
      onTweetsUpdate={fetchTweets}
      followState={isOwnProfile ? undefined : { following, loading: followLoading }}
      blockState={isOwnProfile ? undefined : { blocking, loading: blockLoading }}
      onFollow={handleFollow}
      onUnfollow={handleUnfollow}
      onBlock={handleBlock}
      onUnblock={handleUnblock}
    />
  );
}
