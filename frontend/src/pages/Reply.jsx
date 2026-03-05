import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { postJson } from '../api';
import styles from './Reply.module.css';

const MAX_LENGTH = 240;

export default function Reply() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const parentId = id ? Number(id) : null;
  const isValidId = Number.isInteger(parentId) && parentId >= 1;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Reply text is required.');
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Reply must be at most ${MAX_LENGTH} characters.`);
      return;
    }
    if (!isValidId) {
      setError('Invalid tweet.');
      return;
    }
    setSubmitting(true);
    try {
      await postJson('/api/tweets', { text: trimmed, parent_tweet_id: parentId });
      navigate(`/tweet/${id}/replies`, { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to post reply');
    } finally {
      setSubmitting(false);
    }
  }

  if (id === undefined || id === null || !isValidId) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.error}>Invalid tweet.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Reply</h1>
      <p className={styles.parentHint}>Replying to tweet #{id}</p>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          Your reply
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_LENGTH + 1}
            placeholder="Write your reply..."
            className={styles.textarea}
            rows={4}
            disabled={submitting}
          />
        </label>
        <div className={styles.footer}>
          <span className={text.length > MAX_LENGTH ? styles.counterOver : styles.counter}>
            {text.length}/{MAX_LENGTH}
          </span>
          {error && <p className={styles.error} role="alert">{error}</p>}
          <button type="submit" disabled={submitting || !text.trim() || text.length > MAX_LENGTH} className={styles.button}>
            {submitting ? 'Posting…' : 'Post reply'}
          </button>
        </div>
      </form>
    </div>
  );
}
