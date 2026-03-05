import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson, postJson, deleteJson } from '../api';
import styles from './TweetCard.module.css';

function formatDate(createdAt) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function TweetCard({ tweet, onUpdate }) {
  const [liked, setLiked] = useState(tweet.liked ?? false);
  const [retweeted, setRetweeted] = useState(tweet.retweeted ?? false);
  const [busy, setBusy] = useState(false);

  const username = tweet.author?.username ?? 'unknown';
  const originalId = tweet.retweeted_from ?? tweet.id;

  async function handleLike() {
    if (busy) return;
    setBusy(true);
    try {
      if (liked) {
        await deleteJson(`/api/tweets/${tweet.id}/like`);
        setLiked(false);
      } else {
        await postJson(`/api/tweets/${tweet.id}/like`, {});
        setLiked(true);
      }
      onUpdate?.();
    } catch {
      // keep current state on error
    } finally {
      setBusy(false);
    }
  }

  async function handleRetweet() {
    if (busy) return;
    setBusy(true);
    try {
      if (retweeted) {
        await deleteJson(`/api/tweets/${originalId}/retweet`);
        setRetweeted(false);
      } else {
        await postJson(`/api/tweets/${originalId}/retweet`, {});
        setRetweeted(true);
      }
      onUpdate?.();
    } catch {
      // keep current state on error
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={styles.tweet}>
      <div className={styles.header}>
        <Link to={`/profile/${username}`} className={styles.author}>
          @{username}
        </Link>
        <span className={styles.time}>{formatDate(tweet.created_at)}</span>
      </div>
      <div className={styles.text}>{tweet.text ?? ''}</div>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={handleLike}
          disabled={busy}
          className={liked ? styles.actionActive : styles.action}
          aria-pressed={liked}
        >
          Like {liked ? '✓' : ''}
        </button>
        <button
          type="button"
          onClick={handleRetweet}
          disabled={busy}
          className={retweeted ? styles.actionActive : styles.action}
          aria-pressed={retweeted}
        >
          Retweet {retweeted ? '✓' : ''}
        </button>
        <Link to={`/tweet/${tweet.id}/reply`} className={styles.replyLink}>
          Reply
        </Link>
      </div>
    </article>
  );
}
