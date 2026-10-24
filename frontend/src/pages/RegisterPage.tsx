import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  LuArrowRight,
  LuBanknote,
  LuCalendarDays,
  LuCoins,
  LuLandmark,
  LuLock,
  LuMail,
  LuSmartphone,
  LuTriangleAlert,
  LuUser,
  LuWallet,
} from "react-icons/lu";
import { useAuth } from "../auth/AuthContext";
import type { WalletType } from "../api/auth";
import Field from "../components/Field";
import LedgerSheet from "../components/LedgerSheet";
import "./auth.css";

type ErrKey =
  | "fullName"
  | "email"
  | "password"
  | "walletName"
  | "balance"
  | "income"
  | "day";
type Errs = Partial<Record<ErrKey, string>>;

const walletTypes: {
  value: WalletType;
  label: string;
  icon: typeof LuBanknote;
}[] = [
  { value: "cash", label: "Tiền mặt", icon: LuBanknote },
  { value: "bank", label: "Ngân hàng", icon: LuLandmark },
  { value: "e_wallet", label: "Ví điện tử", icon: LuSmartphone },
];

const toNum = (s: string) => Number(s.replace(/\D/g, "")) || 0;
const money = (s: string) => {
  const n = s.replace(/\D/g, "");
  return n ? new Intl.NumberFormat("vi-VN").format(Number(n)) : "";
};

export default function RegisterPage() {
  const { user, register } = useAuth();
  const nav = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [walletName, setWalletName] = useState("Tiền mặt");
  const [walletType, setWalletType] = useState<WalletType>("cash");
  const [balance, setBalance] = useState("");
  const [income, setIncome] = useState("");
  const [day, setDay] = useState("");

  const [errs, setErrs] = useState<Errs>({});
  const [formErr, setFormErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const incomeNum = toNum(income);
  const dayNum = Number(day) || 0;

  function validateStep1() {
    const e: Errs = {};
    if (fullName.trim().length < 2) e.fullName = "Vui lòng nhập họ tên.";
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = "Email chưa đúng định dạng.";
    if (password.length < 10) e.password = "Mật khẩu cần tối thiểu 10 ký tự.";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  function validateStep2() {
    const e: Errs = {};
    if (!walletName.trim()) e.walletName = "Hãy đặt tên cho ví.";
    if (dayNum && (dayNum < 1 || dayNum > 28)) e.day = "Nhập ngày từ 1 đến 28.";
    setErrs(e);
    return Object.keys(e).length === 0;
  }

  async function submit(withSetup: boolean) {
    if (withSetup && !validateStep2()) return;
    setFormErr("");
    setBusy(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        ...(withSetup
          ? {
              setup: {
                wallet: {
                  name: walletName.trim(),
                  type: walletType,
                  balance: toNum(balance),
                },
                ...(incomeNum ? { monthlyIncome: incomeNum } : {}),
                ...(dayNum ? { cycleStartDay: dayNum } : {}),
                currency: "VND" as const,
              },
            }
          : {}),
      });
      nav("/", { replace: true });
    } catch (err) {
      const e = err as { status?: number; message: string };
      setFormErr(
        e.status === 429
          ? "Bạn thao tác quá nhanh. Vui lòng đợi một lát rồi thử lại."
          : e.message,
      );
      if (e.status === 409) setStep(1); // email đã đăng ký
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (step === 1) {
      if (validateStep1()) {
        setFormErr("");
        setStep(2);
      }
    } else {
      submit(true);
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
          <div className="steps">
            <span className={step >= 1 ? "on" : ""}>1. Tài khoản</span>
            <span className={step >= 2 ? "on" : ""}>2. Ví và kỳ lương</span>
          </div>

          <h1>{step === 1 ? "Tạo tài khoản" : "Thiết lập ban đầu"}</h1>

          <form onSubmit={onSubmit} noValidate>
            {formErr && (
              <div className="form-error" role="alert">
                <LuTriangleAlert size={16} />
                {formErr}
              </div>
            )}

            {step === 1 ? (
              <>
                <Field
                  id="fullName"
                  label="Họ và tên"
                  icon={LuUser}
                  autoComplete="name"
                  value={fullName}
                  error={errs.fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
                <Field
                  id="email"
                  label="Email"
                  icon={LuMail}
                  type="email"
                  autoComplete="email"
                  placeholder="ban@example.com"
                  value={email}
                  error={errs.email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Field
                  id="password"
                  label="Mật khẩu"
                  icon={LuLock}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  error={errs.password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button className="btn btn-primary">
                  Tiếp tục <LuArrowRight size={16} />
                </button>
              </>
            ) : (
              <>
                <div className="field">
                  <span className="field-cap">Loại ví</span>
                  <div className="chips" role="radiogroup" aria-label="Loại ví">
                    {walletTypes.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        role="radio"
                        aria-checked={walletType === t.value}
                        className={`chip ${walletType === t.value ? "on" : ""}`}
                        onClick={() => {
                          setWalletType(t.value);
                          // Gợi ý tên ví nếu người dùng chưa tự sửa
                          if (walletTypes.some((x) => x.label === walletName))
                            setWalletName(t.label);
                        }}
                      >
                        <t.icon size={16} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <Field
                  id="walletName"
                  label="Tên ví"
                  icon={LuWallet}
                  value={walletName}
                  error={errs.walletName}
                  onChange={(e) => setWalletName(e.target.value)}
                />
                <Field
                  id="balance"
                  label="Số dư hiện có (₫)"
                  icon={LuCoins}
                  inputMode="numeric"
                  placeholder="1.500.000"
                  value={balance}
                  error={errs.balance}
                  onChange={(e) => setBalance(money(e.target.value))}
                />

                <div className="field-row">
                  <Field
                    id="income"
                    label="Thu nhập hàng tháng (₫)"
                    icon={LuBanknote}
                    inputMode="numeric"
                    placeholder="12.000.000"
                    value={income}
                    error={errs.income}
                    onChange={(e) => setIncome(money(e.target.value))}
                  />
                  <Field
                    id="day"
                    label="Ngày lương"
                    icon={LuCalendarDays}
                    inputMode="numeric"
                    placeholder="5"
                    maxLength={2}
                    value={day}
                    error={errs.day}
                    onChange={(e) => setDay(e.target.value.replace(/\D/g, ""))}
                  />
                </div>

                <div className="btn-row">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => setStep(1)}
                  >
                    Quay lại
                  </button>
                  <button className="btn btn-primary" disabled={busy}>
                    {busy ? "Đang tạo…" : "Hoàn tất"}
                  </button>
                </div>
                <button
                  type="button"
                  className="skip"
                  disabled={busy}
                  onClick={() => submit(false)}
                >
                  Để sau
                </button>
              </>
            )}
          </form>

          <p className="auth-foot">
            Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
          </p>
        </div>
      </section>

      <aside className="auth-art">
        <LedgerSheet
          income={step === 2 ? incomeNum || undefined : undefined}
          payday={step === 2 ? dayNum || undefined : undefined}
        />
      </aside>
    </div>
  );
}
