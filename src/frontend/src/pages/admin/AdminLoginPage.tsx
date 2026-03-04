import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Heart, Lock } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

const ADMIN_EMAIL = "saikiranpathulothu71@gmail.com";
const ADMIN_PASSWORD = "Sai@2004";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [credentialError, setCredentialError] = useState("");

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/admin" });
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialError("");

    if (!email.trim() || !password.trim()) {
      setCredentialError("Please enter your email and password.");
      return;
    }

    // Strict hardcoded credential check
    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      setCredentialError("Invalid Credentials");
      return;
    }

    // Credentials match — store session and navigate
    login();
    navigate({ to: "/admin" });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6 py-16">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-[400px] h-[300px] rounded-full bg-gold/3 blur-3xl" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% 0%, oklch(0.78 0.14 80 / 0.04) 0%, transparent 60%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md relative"
      >
        {/* Brand mark */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center justify-center gap-2 mb-3"
          >
            <Heart className="w-6 h-6 text-gold" fill="currentColor" />
            <span className="font-display text-2xl font-semibold text-foreground tracking-tight">
              UNEXPECTED<span className="text-gold">.SMILE</span>
            </span>
          </motion.div>
          <p className="text-muted-foreground text-sm tracking-wider uppercase font-medium">
            Admin Portal
          </p>
        </div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="bg-card rounded-2xl p-8 card-glow"
        >
          <div className="flex items-center gap-3 mb-7">
            <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-gold" />
            </div>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">
                Admin Login
              </h1>
              <p className="text-xs text-muted-foreground">
                Authorised access only
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                Email Address
              </Label>
              <Input
                id="email"
                data-ocid="admin.login_input"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (credentialError) setCredentialError("");
                }}
                placeholder="Enter your email"
                className={`bg-input border-border focus:border-gold ${credentialError ? "border-destructive/60" : ""}`}
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  data-ocid="admin.login_password_input"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (credentialError) setCredentialError("");
                  }}
                  placeholder="Enter your password"
                  className={`bg-input border-border focus:border-gold pr-10 ${credentialError ? "border-destructive/60" : ""}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {credentialError && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                data-ocid="admin.login_error_state"
                className="text-destructive text-sm font-medium text-center py-2 px-4 bg-destructive/10 rounded-lg border border-destructive/20"
              >
                {credentialError}
              </motion.p>
            )}

            <Button
              data-ocid="admin.login_submit_button"
              type="submit"
              size="lg"
              className="w-full bg-gold text-primary-foreground hover:bg-gold-light font-semibold mt-2 tracking-wide"
            >
              Login
            </Button>
          </form>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground/40 mt-6">
          © {new Date().getFullYear()} UNEXPECTED.SMILE — Admin Portal
        </p>
      </motion.div>
    </div>
  );
}
