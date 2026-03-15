import { Link } from 'react-router-dom';
import styles from './Settings.module.css';

export default function Settings() {
  return (
    <div className={styles.wrapper}>
      <h1 className={styles.title}>Settings</h1>
      <p className={styles.subtitle}>Manage your account and preferences.</p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Privacy & safety</h2>
        <Link to="/blocked" className={styles.card}>
          <div className={styles.cardText}>
            <span className={styles.cardTitle}>Blocked users</span>
            <span className={styles.cardDesc}>View and manage people you've blocked</span>
          </div>
          <span className={styles.cardArrow} aria-hidden>→</span>
        </Link>
      </section>
    </div>
  );
}
