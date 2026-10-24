import { Navigate, Route, Routes } from "react-router-dom";
import type { ReactElement } from "react";
import { useAuth } from "./auth/AuthContext";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";

function Protected({ children }: { children: ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function TempHome() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 40 }}>
      <h1>Xin chào, {user?.fullName}</h1>
      <p>Đăng nhập thành công. Dashboard sẽ làm ở bước sau.</p>
      <button onClick={logout}>Đăng xuất</button>
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();
  if (loading) return null;
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <Protected>
            <TempHome />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
