import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  LuLock,
  LuMail,
  LuWallet,
  LuTriangleAlert,
  LuArrowRight,
} from "react-icons/lu";
import { useAuth } from "../auth/AuthContext";
import Field from "../components/Field";
import LedgerSheet from "../components/LedgerSheet";
import "./auth.css";

export default function LoginPage() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password)
      return setError("Vui lòng nhập email và mật khẩu.");
    setBusy(true);
    try {
      await login(email.trim(), password);
      nav("/", { replace: true });
    } catch (err) {
      // Luôn thông báo chung chung, không tiết lộ email có tồn tại hay không
      const status = (err as { status?: number }).status;
      setError(
        status === 429
          ? "Bạn thử quá nhiều lần. Vui lòng đợi một lát rồi thử lại."
          : "Email hoặc mật khẩu không đúng.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth">
      <section className="auth-form-side">
        <div className="brand">
          <span className="brand-mark">
            <LuWallet size={26} />
          </span>
          Smart Finance
        </div>

        <div className="auth-main">
          <h1>Đăng nhập</h1>

          <form onSubmit={onSubmit} noValidate>
            {error && (
              <div className="form-error" role="alert">
                <LuTriangleAlert size={16} />
                {error}
              </div>
            )}
            <Field
              id="email"
              label="Email"
              icon={LuMail}
              type="email"
              autoComplete="email"
              placeholder="ban@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Field
              id="password"
              label="Mật khẩu"
              icon={LuLock}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button className="btn btn-primary" disabled={busy}>
              {busy ? "Đang đăng nhập…" : "Đăng nhập"}{" "}
              <LuArrowRight size={16} />
            </button>
          </form>

          <p className="auth-foot">
            Chưa có tài khoản? <Link to="/register">Đăng ký</Link>
          </p>
        </div>
      </section>

      <aside className="auth-art">
        <LedgerSheet />
      </aside>
    </div>
  );
}
