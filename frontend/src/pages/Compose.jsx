import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postJson } from '../api';
import styles from './Compose.module.css';

const MAX_LENGTH = 240;

export default function Compose() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const trimmed = text.trim();
    if (!trimmed) {
      setError('Tweet text is required.');
      return;
    }
    if (trimmed.length > MAX_LENGTH) {
      setError(`Tweet must be at most ${MAX_LENGTH} characters.`);
      return;
    }
    setSubmitting(true);
    try {
      await postJson('/api/tweets', { text: trimmed });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.body?.error || err.message || 'Failed to post tweet');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>New tweet</h1>
      <form onSubmit={handleSubmit} className={styles.form}>
        <label className={styles.label}>
          What's happening?
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={MAX_LENGTH + 1}
            placeholder="Write your tweet..."
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
            {submitting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </form>
    </div>
  );
}
