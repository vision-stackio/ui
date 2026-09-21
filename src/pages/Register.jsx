import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Create account - Vision";
  }, []);

  const isFormValid =
    name.length > 0 &&
    email.length > 0 &&
    password.length > 0 &&
    confirmPassword.length > 0;

  const submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.register(name, email, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left side - Form */}
      <div className="flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-[360px] flex flex-col items-center text-center">
          <Link to="/">
            <img src="/image/b.png" className="w-10 mb-8" alt="Logo" />
          </Link>

          <h1 className="text-2xl font-bold text-[#121212] mb-2">
            Sign up to Vision
          </h1>
          <p className="text-slate-500 text-[15px] mb-8">
            Launch Beautiful Sites with ease.
          </p>

          <form onSubmit={submit} className="w-full">
            <div className="w-full space-y-3 mb-4">
              <input
                type="text"
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#f4f4f5] border-none rounded-xl px-4 py-3.5 text-[15px] focus:ring-2 focus:ring-black-500 outline-none transition-all"
                required
              />
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f4f4f5] border-none rounded-xl px-4 py-3.5 text-[15px] focus:ring-2 focus:ring-black-500 outline-none transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f4f4f5] border-none rounded-xl px-4 py-3.5 text-[15px] focus:ring-2 focus:ring-black-500 outline-none transition-all"
                required
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-[#f4f4f5] border-none rounded-xl px-4 py-3.5 text-[15px] focus:ring-2 focus:ring-black-500 outline-none transition-all"
                required
              />

              {(error || done) && (
                <p className={`text-sm text-center ${done ? "text-indigo-500" : "text-red-500"}`}>
                  {done ? "Account created — redirecting to login…" : error}
                </p>
              )}

              <button
                type="submit"
                disabled={!isFormValid || submitting || done}
                className={`w-full font-semibold py-3.5 rounded-xl transition-all duration-300 ${
                  isFormValid && !submitting && !done
                    ? "bg-[#1b1b1c] text-white shadow-lg shadow-indigo-100 cursor-pointer hover:opacity-90 active:scale-[0.98]"
                    : "bg-[#8b8df8]/20 text-gray-600 cursor-not-allowed"
                }`}
              >
                {submitting ? "Creating account..." : "Continue with email"}
              </button>
            </div>
          </form>

          <p className="text-[14px] text-slate-500 flex items-center justify-center gap-1.5 mt-4">
            Already have an account?
            <Link to="/login" className="text-black-500 font-medium hover:underline">
              Login
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex items-center justify-center relative overflow-hidden bg-[#fafafa]">
        <img
          src="/image/register.gif"
          alt="register"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}