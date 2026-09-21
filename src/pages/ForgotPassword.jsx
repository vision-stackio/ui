import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    document.title = "Reset password - Vision";
  }, []);

  const isFormValid = email.length > 0;

  const submit = async (e) => {
    e.preventDefault();
    await authApi.forgotPassword(email).catch(() => { });
    setSent(true); // always show the same generic response — never reveal whether the email exists
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white">
      <div className="hidden lg:flex items-center justify-center relative overflow-hidden bg-[#fafafa]">
        <img
          src="/image/login.gif"
          alt="forgot password"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
      <div className="flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-[360px] flex flex-col items-center text-center">
          <Link to="/">
            <img src="/image/b.png" className="w-10 mb-8" alt="Logo" />
          </Link>

          <h1 className="text-2xl font-bold text-[#121212] mb-2">
            Reset your password
          </h1>
          <p className="text-slate-500 text-[15px] mb-8">
            Enter your email and we’ll send you a reset link.
          </p>

          <form onSubmit={submit} className="w-full">
            <div className="w-full space-y-3 mb-4">
              {sent ? (
                <p className="text-black-500 text-sm text-center">
                  If that account exists, a reset link has been sent.
                </p>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#f4f4f5] border-none rounded-xl px-4 py-3.5 text-[15px] focus:ring-2 focus:ring-black-500 outline-none transition-all"
                    required
                  />

                  <button
                    type="submit"
                    disabled={!isFormValid}
                    className={`w-full font-semibold py-3.5 rounded-xl transition-all duration-300 ${isFormValid
                        ? "bg-[#1b1b1c] text-white shadow-lg shadow-black-200 cursor-pointer hover:opacity-90 active:scale-[0.98]"
                        : "bg-[#8b8df8]/20 text-gray-600 cursor-not-allowed"
                      }`}
                  >
                    Send reset link
                  </button>
                </>
              )}
            </div>
          </form>

          <p className="text-[14px] text-slate-500 flex items-center justify-center gap-1.5 mt-4">
            <Link to="/login" className="text-black-500 font-medium hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}

    </div>
  );
}