import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import InactivityTracker from './auth/InactivityTracker';
import ProtectedRoute from './auth/ProtectedRoute';
import GuestOnly from './auth/GuestOnly';
import AuthenticatedLayout from './layout/AuthenticatedLayout';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Compose from './pages/Compose';
import Reply from './pages/Reply';
import Replies from './pages/Replies';
import Profile from './pages/Profile';
import ProfileEdit from './pages/ProfileEdit';
import ProfileByUsername from './pages/ProfileByUsername';
import Settings from './pages/Settings';
import Blocked from './pages/Blocked';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <InactivityTracker />
        <Routes>
          <Route path="/login" element={<GuestOnly><Login /></GuestOnly>} />
          <Route path="/signup" element={<GuestOnly><Signup /></GuestOnly>} />
          <Route path="/" element={<ProtectedRoute><AuthenticatedLayout><Home /></AuthenticatedLayout></ProtectedRoute>} />
          <Route path="/compose" element={<ProtectedRoute><AuthenticatedLayout><Compose /></AuthenticatedLayout></ProtectedRoute>} />
          <Route path="/tweet/:id/reply" element={<ProtectedRoute><AuthenticatedLayout><Reply /></AuthenticatedLayout></ProtectedRoute>} />
          <Route path="/tweet/:id/replies" element={<ProtectedRoute><AuthenticatedLayout><Replies /></AuthenticatedLayout></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><AuthenticatedLayout><Profile /></AuthenticatedLayout></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><AuthenticatedLayout><ProfileEdit /></AuthenticatedLayout></ProtectedRoute>} />
          <Route path="/profile/:username" element={<ProtectedRoute><AuthenticatedLayout><ProfileByUsername /></AuthenticatedLayout></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><AuthenticatedLayout><Settings /></AuthenticatedLayout></ProtectedRoute>} />
          <Route path="/blocked" element={<ProtectedRoute><AuthenticatedLayout><Blocked /></AuthenticatedLayout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
