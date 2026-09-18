import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Eye, EyeOff, Building2 } from "lucide-react";
import { useAuthStore } from "../../store";
import { authApi } from "../../api";
import { Button, Input } from "../../components/ui";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setAuth(data.token, data.user, data.agent || null);
      if (data.user.role === "admin") navigate("/admin");
      else if (data.user.role === "agent") navigate("/agent");
      else navigate("/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surf px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Off Campus</h1>
          <p className="text-sm text-ink-soft mt-1">FUTA Off-Campus Housing</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-line"
        >
          <h2 className="text-lg font-bold text-center">Sign In</h2>
          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}
          <Input
            label="Email"
            icon={Mail}
            type="email"
            placeholder="you@futa.edu.ng"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <Input
              label="Password"
              type={showPw ? "text" : "password"}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-[38px] text-ink-soft"
              onClick={() => setShowPw(!showPw)}
            >
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline block text-right"
          >
            Forgot password?
          </Link>
          <Button type="submit" loading={loading} className="w-full">
            Sign In
          </Button>
          <div className="bg-primary-50 border border-primary/10 rounded-xl p-3 text-xs text-ink-soft space-y-0.5">
            <p className="font-semibold text-primary-dark">
              Demo accounts (password: Password123!)
            </p>
            <p>Student: student@housingbooking.app</p>
            <p>Agent: agent1@housingbooking.app</p>
            <p>Admin: supreident@student.futa.edu.ng</p>
          </div>
          <p className="text-center text-sm text-ink-soft">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-primary font-medium hover:underline"
            >
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export function SignupPage() {
  const [type, setType] = useState<"student" | "agent">("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [department, setDepartment] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [idDocUrl, setIdDocUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let data;
      if (type === "student") {
        data = await authApi.signupStudent({
          name,
          email,
          password,
          matric_no: matricNo,
          department,
        });
      } else {
        data = await authApi.signupAgent({
          name,
          email,
          password,
          business_name: businessName,
          phone,
          id_document_url: idDocUrl || "https://placeholder.doc",
        });
      }
      setAuth(data.token, data.user, data.agent || null);
      navigate(type === "agent" ? "/agent" : "/");
    } catch (err: any) {
      setError(err?.response?.data?.error || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surf px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">HostelBook</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-line"
        >
          <h2 className="text-lg font-bold text-center">Create Account</h2>

          {/* Type toggle */}
          <div className="flex bg-surf rounded-lg p-1">
            {(["student", "agent"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all
                  ${type === t ? "bg-primary text-white" : "text-ink-soft hover:text-ink"}`}
              >
                {t === "student" ? "Student" : "Housing Agent"}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-lg">
              {error}
            </p>
          )}

          <Input
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {type === "student" && (
            <>
              <Input
                label="Matric Number"
                placeholder="FUT/2022/001"
                value={matricNo}
                onChange={(e) => setMatricNo(e.target.value)}
                required
              />
              <Input
                label="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
            </>
          )}
          {type === "agent" && (
            <>
              <Input
                label="Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
              />
              <Input
                label="Phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              <Input
                label="ID Document URL"
                placeholder="Cloudinary URL"
                value={idDocUrl}
                onChange={(e) => setIdDocUrl(e.target.value)}
                required
              />
              <p className="text-xs text-ink-soft bg-yellow-50 p-2 rounded-lg">
                Agent accounts require admin approval before you can post
                listings.
              </p>
            </>
          )}

          <Button type="submit" loading={loading} className="w-full">
            {type === "agent" ? "Create Agent Account" : "Sign Up as Student"}
          </Button>

          <p className="text-center text-sm text-ink-soft">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary font-medium hover:underline"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword({ email });
      setDone(true);
    } catch {
      setDone(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surf px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold">Reset Password</h1>
        </div>
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-sm p-6 space-y-4 border border-line"
        >
          {done ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="text-sm">
                If that email exists, a reset link has been sent.
              </p>
              <Link
                to="/login"
                className="text-primary text-sm font-medium mt-3 inline-block hover:underline"
              >
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <Input
                label="Email"
                icon={Mail}
                type="email"
                placeholder="you@student.futa.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" loading={loading} className="w-full">
                Send Reset Link
              </Button>
              <Link
                to="/login"
                className="text-sm text-primary font-medium hover:underline block text-center"
              >
                Back to Login
              </Link>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
