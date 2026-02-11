import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRole, allowedRoles }) => {
    const { user, isAuthenticated } = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Support both single role and array of allowed roles
    const roles = allowedRoles || (requiredRole ? [requiredRole] : []);
    
    if (roles.length > 0 && !roles.includes(user.role)) {
        // Redirect to their appropriate dashboard
        if (user.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />;
        } else if (user.role === 'organizer') {
            return <Navigate to="/organizer/dashboard" replace />;
        } else {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
