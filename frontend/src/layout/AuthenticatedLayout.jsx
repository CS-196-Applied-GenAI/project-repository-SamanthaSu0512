import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import styles from './AuthenticatedLayout.module.css';

export default function AuthenticatedLayout({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className={styles.wrapper}>
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <span className={styles.brand}>Chirper</span>
          <Link to="/" className={styles.link}>Feed</Link>
          <Link to="/compose" className={`${styles.link} ${styles.linkCompose}`}>Compose</Link>
          <Link to="/profile" className={styles.link}>My profile</Link>
          <Link to="/settings" className={styles.link}>Settings</Link>
          <button type="button" onClick={handleLogout} className={styles.logout}>
            Logout
          </button>
        </div>
      </nav>
      <main className={styles.main}>
        <div className={styles.mainInner}>
          {children}
        </div>
      </main>
    </div>
  );
}
