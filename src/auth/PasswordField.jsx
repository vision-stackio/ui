import { useState, useId } from "react";

// Eye icon is positioned inside a wrapper that contains ONLY the input,
// so it stays vertically centered even when an error message or the
// "Forgot password?" link appears below/above it.
export default function PasswordField({
  label = "Password",
  value,
  onChange,
  onBlur,
  name,
  autoComplete,
  autoFocus,
  error,
  right,
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  return (
    <div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          placeholder=" "
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          aria-invalid={!!error}
          className={`peer h-11 w-full rounded-lg border bg-white pl-3 pr-11 pt-3 text-sm text-gray-900 outline-none transition
            ${error ? "border-red-500 focus:ring-2 focus:ring-red-200" : "border-gray-300 focus:border-[#0B57D0] focus:ring-2 focus:ring-blue-100"}`}
        />
        <label
          htmlFor={id}
          className="pointer-events-none absolute left-3 top-1 text-[11px] text-gray-500 transition-all
            peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm
            peer-focus:top-1 peer-focus:translate-y-0 peer-focus:text-[11px] peer-focus:text-[#0B57D0]"
        >
          {label}
        </label>

        {/* Centered against the input box only */}
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-700"
        >
          {visible ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          )}
        </button>
      </div>

      {(error || right) && (
        <div className="mt-1 flex items-start justify-between gap-2">
          <span className="text-xs text-red-600">{error}</span>
          {right}
        </div>
      )}
    </div>
  );
}