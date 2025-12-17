// Protected Route Component
// This wraps routes that require authentication
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { currentUser } = useAuth();

    // If not logged in, redirect to sign in page
    if (!currentUser) {
        return <Navigate to="/signin" replace />;
    }

    // If logged in, show the protected content
    return <>{children}</>;
}
