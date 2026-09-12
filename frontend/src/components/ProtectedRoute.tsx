import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute() {
  const {
    isAuthenticated,
    initializing,
  } = useAuth();

  if (initializing) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-card">
          <div className="loading-spinner"></div>
          <p>Restoring session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  return <Outlet />;
}