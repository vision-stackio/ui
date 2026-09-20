import { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";


export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    document.title = "Log in - Vision";
  }, []);

  const isFormValid = email.length > 0 && password.length > 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    setError(null);
    setSubmitting(true);
    try {
      const { user } = await authApi.login(email, password);
      authStore.set({ user, loading: false, initialized: true });
      navigate(location.state?.from?.pathname ?? "/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Login failed");
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
            Log in to Vision
          </h1>
          <p className="text-slate-500 text-[15px] mb-8">
            Launch Beautiful Sites with ease.
          </p>

          <form onSubmit={submit} className="w-full">
            <div className="w-full space-y-3 mb-4">
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#f4f4f5] border-none rounded-xl px-4 py-3.5 text-[15px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#f4f4f5] border-none rounded-xl px-4 py-3.5 text-[15px] focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <button
                type="submit"
                disabled={!isFormValid || submitting}
                className={`w-full font-semibold py-3.5 rounded-xl transition-all cursor-pointer duration-300 ${
                  isFormValid && !submitting
                    ? "bg-[#8b8df8] text-white shadow-lg shadow-indigo-200 hover:opacity-90 active:scale-[0.98]"
                    : "bg-[#8b8df8]/20 text-[#8b8df8] cursor-not-allowed"
                }`}
              >
                {submitting ? "Logging in…" : "Continue with email"}
              </button>
            </div>
          </form>

          <div className="flex justify-between w-full mt-2 text-[14px] text-slate-500">
            <Link to="/forgot-password" className="hover:text-indigo-500 hover:underline">
              Forgot password?
            </Link>
            <Link to="/register" className="text-indigo-500 font-medium hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>

      {/* Right side - Visual */}
      <div className="hidden lg:flex items-center justify-center relative overflow-hidden bg-[#fafafa]">
        <img
          src="/image/login.gif"
          alt="login"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}