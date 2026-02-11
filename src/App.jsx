import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ParticipantDashboard from './pages/participant/ParticipantDashboard';
import BrowseEvents from './pages/participant/BrowseEvents';
import EventDetails from './pages/participant/EventDetails';
import Profile from './pages/participant/Profile';
import ClubsListing from './pages/participant/ClubsListing';
import OrganizerDetail from './pages/participant/OrganizerDetail';
import TeamsDashboard from './pages/participant/TeamsDashboard';
import AdminDashBoard from './pages/admin/AdminDashBoard';
import OrganizerDashboard from './pages/organizer/OrganizerDashboard';

function App() {
  return (
    <Router>
      <AuthProvider> {/* Provides authentication context to the entire app */ }
        <div>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Redirect root to login for now */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Participant Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute requiredRole="participant">
                <ParticipantDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/browse-events" element={
              <ProtectedRoute requiredRole="participant">
                <BrowseEvents />
              </ProtectedRoute>
            } />
            
            <Route path="/teams" element={
              <ProtectedRoute requiredRole="participant">
                <TeamsDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/events/:id" element={
              <ProtectedRoute allowedRoles={['participant', 'organizer']}>
                <EventDetails />
              </ProtectedRoute>
            } />
            
            <Route path="/profile" element={
              <ProtectedRoute requiredRole="participant">
                <Profile />
              </ProtectedRoute>
            } />
            
            <Route path="/clubs" element={
              <ProtectedRoute requiredRole="participant">
                <ClubsListing />
              </ProtectedRoute>
            } />
            
            <Route path="/organizers/:id" element={
              <ProtectedRoute requiredRole="participant">
                <OrganizerDetail />
              </ProtectedRoute>
            } />
            
            {/* Organizer Protected routes */}
            <Route path="/organizer/dashboard" element={
              <ProtectedRoute requiredRole="organizer">
                <OrganizerDashboard />
              </ProtectedRoute>
            } />
            
            {/* Admin Protected routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute requiredRole="admin">
                <AdminDashBoard />
              </ProtectedRoute>
            } />

            {/* 404 */}
            <Route path="*" element={<div>404 - Page Not Found</div>} />
          </Routes>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
