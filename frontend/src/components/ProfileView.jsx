import { useCallback } from 'react';
import TweetCard from './TweetCard';
import styles from './ProfileView.module.css';

function avatarSrc(profilePicture) {
  if (!profilePicture) return null;
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  return profilePicture.startsWith('http') ? profilePicture : base + profilePicture;
}

export default function ProfileView({
  user,
  tweets = [],
  loading: tweetsLoading,
  isOwnProfile,
  onTweetsUpdate,
  followState,
  blockState,
  onFollow,
  onUnfollow,
  onBlock,
  onUnblock,
}) {
  const refetchTweets = useCallback(() => {
    onTweetsUpdate?.();
  }, [onTweetsUpdate]);

  if (!user) return null;

  const src = avatarSrc(user.profile_picture);

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.avatarWrap}>
          {src ? (
            <img src={src} alt="" className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder} aria-hidden />
          )}
        </div>
        <h1 className={styles.name}>{user.name || user.username || 'Unknown'}</h1>
        <p className={styles.username}>@{user.username}</p>
        {user.bio && <p className={styles.bio}>{user.bio}</p>}
        {!isOwnProfile && (
          <div className={styles.actions}>
            {followState?.following ? (
              <button
                type="button"
                className={styles.buttonSecondary}
                disabled={followState.loading}
                onClick={onUnfollow}
              >
                {followState.loading ? '…' : 'Unfollow'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.buttonPrimary}
                disabled={followState?.loading}
                onClick={onFollow}
              >
                {followState?.loading ? '…' : 'Follow'}
              </button>
            )}
            {blockState?.blocking ? (
              <button
                type="button"
                className={styles.buttonDanger}
                disabled={blockState.loading}
                onClick={onUnblock}
              >
                {blockState.loading ? '…' : 'Unblock'}
              </button>
            ) : (
              <button
                type="button"
                className={styles.buttonSecondary}
                disabled={blockState?.loading}
                onClick={onBlock}
              >
                {blockState?.loading ? '…' : 'Block'}
              </button>
            )}
          </div>
        )}
      </div>
      <section className={styles.tweetsSection}>
        <h2 className={styles.tweetsTitle}>Tweets</h2>
        {tweetsLoading && <p className={styles.loading}>Loading tweets…</p>}
        {!tweetsLoading && tweets.length === 0 && (
          <p className={styles.empty}>No tweets yet.</p>
        )}
        {!tweetsLoading && tweets.length > 0 && (
          <ul className={styles.tweetList}>
            {tweets.map((tweet) => (
              <li key={tweet.id}>
                <TweetCard
                  tweet={{
                    ...tweet,
                    liked: tweet.liked ?? false,
                    retweeted: tweet.retweeted ?? false,
                  }}
                  onUpdate={refetchTweets}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
