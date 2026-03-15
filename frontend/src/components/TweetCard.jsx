import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getJson, postJson, deleteJson } from '../api';
import styles from './TweetCard.module.css';

function formatDate(createdAt) {
  if (!createdAt) return '';
  const d = new Date(createdAt);
  return d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export default function TweetCard({ tweet, onUpdate, currentUserId }) {
  const [liked, setLiked] = useState(tweet.liked ?? false);
  const [retweeted, setRetweeted] = useState(tweet.retweeted ?? false);
  const [busy, setBusy] = useState(false);

  const isRetweet = Boolean(tweet.originalTweet);
  const username = tweet.author?.username ?? 'unknown';
  const originalId = tweet.retweeted_from ?? tweet.id;
  // For retweets, show original tweet content; otherwise show this tweet's text
  const displayText = isRetweet ? (tweet.originalTweet?.text ?? '') : (tweet.text ?? '');
  const displayAuthor = isRetweet ? tweet.originalTweet?.author : tweet.author;
  const displayUsername = displayAuthor?.username ?? 'unknown';
  const tweetOwnerId = tweet.user_id ?? tweet.author_id;
  const isOwner = currentUserId != null && tweetOwnerId === currentUserId;

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

  async function handleDelete() {
    if (busy || !isOwner) return;
    if (!window.confirm('Delete this tweet?')) return;
    setBusy(true);
    try {
      await deleteJson(`/api/tweets/${tweet.id}`);
      onUpdate?.();
    } catch {
      // keep card on error
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={styles.tweet}>
      {isRetweet && (
        <p className={styles.retweetedBy}>
          <span className={styles.retweetedByLabel}>Retweeted by </span>
          <Link to={`/profile/${username}`} className={styles.retweeterLink}>@{username}</Link>
        </p>
      )}
      <div className={styles.header}>
        <Link to={`/profile/${displayUsername}`} className={styles.author}>
          @{displayUsername}
        </Link>
        <span className={styles.time}>{formatDate(isRetweet ? tweet.originalTweet?.created_at : tweet.created_at)}</span>
      </div>
      <div className={styles.text}>{displayText}</div>
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
        <Link to={`/tweet/${isRetweet ? tweet.originalTweet?.id : tweet.id}/reply`} className={styles.replyLink}>
          Reply
        </Link>
        {isOwner && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className={styles.deleteBtn}
            aria-label="Delete tweet"
          >
            Delete
          </button>
        )}
      </div>
    </article>
  );
}
