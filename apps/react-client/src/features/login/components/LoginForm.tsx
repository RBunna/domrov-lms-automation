import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FormField } from "@/components";
import { PrimaryButton } from "@/components/primitives";
import { useAuth } from "@/context/AuthContext";
import GoogleOAuthButton from "./GoogleOAuthButton";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = (): boolean => {
    if (!email || !password) {
      setError("Please fill in all fields");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  /**
   * Handle form submission
   * Calls POST /api/auth?action=login via authAPI
   */
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!validate()) return;

    setLoading(true);
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err: unknown) {
      // Extract error message from API response
      const errorMessage = err instanceof Error ? err.message : "An error occurred. Please try again.";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Email/Password Form */}
      <form className="space-y-6" onSubmit={handleSubmit}>
        <FormField
          id="email"
          label="Email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          required
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <PrimaryButton type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Continue"}
          </PrimaryButton>
          <p className="text-xs text-slate-500 text-center">
            Sign in with your email and password to access your account.
          </p>
        </div>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">Or continue with</span>
        </div>
      </div>

      {/* OAuth Buttons */}
      <div className="space-y-3">
        <GoogleOAuthButton />
      </div>

      {/* Sign Up Link */}
      <div className="mt-6 text-center">
        <span className="text-sm text-slate-600">Don't have an account?</span>
        <a href="/login/signup" className="ml-2 text-sm text-blue-700 hover:underline font-semibold">Sign Up</a>
      </div>
    </div>
  );
}