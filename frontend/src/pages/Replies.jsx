import { useState, useEffect, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getJson } from '../api';
import TweetCard from '../components/TweetCard';
import styles from './Replies.module.css';

export default function Replies() {
  const { id } = useParams();
  const [replies, setReplies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const parentId = id ? Number(id) : null;
  const isValidId = Number.isInteger(parentId) && parentId >= 1;

  const fetchReplies = useCallback(() => {
    if (!isValidId) return;
    setLoading(true);
    setError(null);
    getJson(`/api/tweets/${id}/replies`)
      .then((data) => {
        setReplies(Array.isArray(data) ? data : []);
      })
      .catch((err) => setError(err.message || 'Failed to load replies'))
      .finally(() => setLoading(false));
  }, [id, isValidId]);

  useEffect(() => {
    if (!isValidId) {
      setLoading(false);
      setError('Invalid tweet.');
      return;
    }
    fetchReplies();
  }, [isValidId, fetchReplies]);

  if (id === undefined || id === null || !isValidId) {
    return (
      <div className={styles.wrapper}>
        <p className={styles.error}>Invalid tweet.</p>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h1 className={styles.title}>Replies</h1>
        <p className={styles.parentHint}>Replies to tweet #{id}</p>
        <Link to={`/tweet/${id}/reply`} className={styles.replyLink}>
          Reply to this tweet
        </Link>
      </div>
      {loading && <p className={styles.loading}>Loading replies…</p>}
      {error && !loading && <p className={styles.error} role="alert">{error}</p>}
      {!loading && !error && replies.length === 0 && (
        <p className={styles.empty}>No replies yet.</p>
      )}
      {!loading && !error && replies.length > 0 && (
        <ul className={styles.replyList}>
          {replies.map((reply) => (
            <li key={reply.id}>
              <TweetCard
                tweet={{
                  ...reply,
                  liked: reply.liked ?? false,
                  retweeted: reply.retweeted ?? false,
                }}
                onUpdate={fetchReplies}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
