import { useState } from "react";
import type { InputHTMLAttributes } from "react";
import type { IconType } from "react-icons";
import { LuEye, LuEyeOff } from "react-icons/lu";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon: IconType;
  error?: string;
  hint?: string;
};

export default function Field({
  label,
  icon: Icon,
  error,
  hint,
  type,
  id,
  ...rest
}: Props) {
  const [show, setShow] = useState(false);
  const isPw = type === "password";

  return (
    <div className={`field ${error ? "has-error" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <div className="field-box">
        <Icon className="field-icon" size={17} />
        <input id={id} type={isPw && show ? "text" : type} {...rest} />
        {isPw && (
          <button
            type="button"
            className="field-toggle"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
          >
            {show ? <LuEyeOff size={17} /> : <LuEye size={17} />}
          </button>
        )}
      </div>
      {error ? (
        <p className="field-msg err">{error}</p>
      ) : hint ? (
        <p className="field-msg">{hint}</p>
      ) : null}
    </div>
  );
}
