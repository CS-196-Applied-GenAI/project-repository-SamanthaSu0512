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
        <Link to="/" className={styles.link}>Feed</Link>
        <Link to="/compose" className={styles.link}>Compose</Link>
        <Link to="/profile" className={styles.link}>My profile</Link>
        <button type="button" onClick={handleLogout} className={styles.logout}>
          Logout
        </button>
      </nav>
      <main className={styles.main}>
        {children}
      </main>
    </div>
  );
}
