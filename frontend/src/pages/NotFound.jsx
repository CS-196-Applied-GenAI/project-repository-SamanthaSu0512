import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Page not found</h1>
      <p className={styles.message}>The page you’re looking for doesn’t exist.</p>
      <div className={styles.links}>
        <Link to="/" className={styles.link}>
          Go to Feed
        </Link>
        <Link to="/login" className={styles.link}>
          Log in
        </Link>
      </div>
    </div>
  );
}
