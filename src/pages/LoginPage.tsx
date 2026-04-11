import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Lock, User, AlertTriangle, Mail, UserPlus, Phone, ArrowLeft, KeyRound } from "lucide-react";

type AuthView = "signin" | "signup" | "forgot" | "otp-verify" | "reset-password";

export default function LoginPage() {
  const { login, loginWithPhone, signup, resetPassword, sendPhoneOtp, verifyPhoneOtp, updatePassword } = useAuth();
  const [view, setView] = useState<AuthView>("signin");
  const [loginMethod, setLoginMethod] = useState<"email" | "phone">("email");

  // Fields
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"guard" | "manager">("guard");
  const [otpCode, setOtpCode] = useState("");
  const [otpPhone, setOtpPhone] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Check if we're on the reset-password page (from email link)
  const isResetPage = window.location.pathname === "/reset-password" || window.location.hash.includes("type=recovery");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    let result;
    if (loginMethod === "email") {
      result = await login(email, password);
    } else {
      result = await loginWithPhone(phone, password);
    }
    if (!result.success) setError(result.error || "Authentication failed");
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    const result = await signup(email, password, name || email, role, phone);
    if (!result.success) {
      setError(result.error || "Signup failed");
    } else {
      setSuccess("Account created! Please check your email to verify your account before signing in.");
    }
    setIsLoading(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    const result = await resetPassword(email);
    if (!result.success) {
      setError(result.error || "Failed to send reset email");
    } else {
      setSuccess("Password reset link sent to your email!");
    }
    setIsLoading(false);
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    const result = await sendPhoneOtp(otpPhone);
    if (!result.success) {
      setError(result.error || "Failed to send OTP");
    } else {
      setSuccess("OTP sent to your phone!");
      setView("otp-verify");
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    const result = await verifyPhoneOtp(otpPhone, otpCode);
    if (!result.success) {
      setError(result.error || "Invalid OTP");
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");
    const result = await updatePassword(newPassword);
    if (!result.success) {
      setError(result.error || "Failed to update password");
    } else {
      setSuccess("Password updated successfully! You can now sign in.");
      setTimeout(() => { window.location.href = "/"; }, 2000);
    }
    setIsLoading(false);
  };

  const renderError = () =>
    error ? (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
        <AlertTriangle className="w-4 h-4 shrink-0" />
        {error}
      </div>
    ) : null;

  const renderSuccess = () =>
    success ? (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
        ✅ {success}
      </div>
    ) : null;

  // Reset Password page (from email link)
  if (isResetPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <KeyRound className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Reset Password</h1>
            <p className="text-muted-foreground mt-1">Enter your new password</p>
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              {renderError()}
              {renderSuccess()}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter new password" required minLength={6} />
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50">
                {isLoading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">SecurePatrol</h1>
          <p className="text-muted-foreground mt-1">Digital Guard Patrol System</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-lg">
          {/* Back button for sub-views */}
          {(view === "forgot" || view === "otp-verify") && (
            <button onClick={() => { setView("signin"); setError(""); setSuccess(""); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition">
              <ArrowLeft className="w-4 h-4" /> Back to Sign In
            </button>
          )}

          {/* Sign In / Sign Up tabs */}
          {(view === "signin" || view === "signup") && (
            <div className="flex mb-4 rounded-lg bg-secondary p-1">
              <button type="button"
                onClick={() => { setView("signin"); setError(""); setSuccess(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${view === "signin" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                Sign In
              </button>
              <button type="button"
                onClick={() => { setView("signup"); setError(""); setSuccess(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition ${view === "signup" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>
                Sign Up
              </button>
            </div>
          )}

          {/* ===== SIGN IN ===== */}
          {view === "signin" && (
            <form onSubmit={handleSignIn} className="space-y-4">
              {renderError()}

              {/* Email / Phone toggle */}
              <div className="flex gap-2 rounded-lg bg-secondary/50 p-1">
                <button type="button" onClick={() => setLoginMethod("email")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition flex items-center justify-center gap-1 ${loginMethod === "email" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
                  <Mail className="w-3 h-3" /> Email
                </button>
                <button type="button" onClick={() => setLoginMethod("phone")}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-md transition flex items-center justify-center gap-1 ${loginMethod === "phone" ? "bg-primary/20 text-primary" : "text-muted-foreground"}`}>
                  <Phone className="w-3 h-3" /> Phone
                </button>
              </div>

              {loginMethod === "email" ? (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter email" required />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="+1234567890" required />
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter password" required minLength={6} />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button type="button" onClick={() => { setView("forgot"); setError(""); setSuccess(""); }}
                  className="text-xs text-primary hover:underline">Forgot Password?</button>
                <button type="button" onClick={() => { setOtpPhone(phone || ""); setView("forgot"); setError(""); setSuccess(""); }}
                  className="text-xs text-muted-foreground hover:text-primary">Login with OTP</button>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50">
                {isLoading ? "Please wait..." : "Sign In"}
              </button>
            </form>
          )}

          {/* ===== SIGN UP ===== */}
          {view === "signup" && (
            <form onSubmit={handleSignUp} className="space-y-4">
              {renderError()}
              {renderSuccess()}

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter your name" required />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter email" required />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="+1234567890 (optional)" />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                    placeholder="Enter password" required minLength={6} />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Role</label>
                <select value={role} onChange={e => setRole(e.target.value as "guard" | "manager")}
                  className="w-full py-2.5 px-3 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50">
                  <option value="guard">🛡️ Guard</option>
                  <option value="manager">📊 Manager</option>
                </select>
              </div>

              <button type="submit" disabled={isLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50 flex items-center justify-center gap-2">
                <UserPlus className="w-4 h-4" />
                {isLoading ? "Creating..." : "Create Account"}
              </button>
            </form>
          )}

          {/* ===== FORGOT PASSWORD ===== */}
          {view === "forgot" && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold">Reset Password</h2>
              <p className="text-sm text-muted-foreground">Choose how to reset your password:</p>

              {/* Email reset */}
              <form onSubmit={handleForgotPassword} className="space-y-3">
                {renderError()}
                {renderSuccess()}
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="Enter your email" required />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50">
                  {isLoading ? "Sending..." : "Send Reset Link via Email"}
                </button>
              </form>

              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center"><span className="bg-card px-2 text-xs text-muted-foreground">OR</span></div>
              </div>

              {/* Phone OTP reset */}
              <form onSubmit={handleSendPhoneOtp} className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="tel" value={otpPhone} onChange={e => setOtpPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                      placeholder="+1234567890" required />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  className="w-full py-2.5 bg-secondary text-foreground font-semibold rounded-lg hover:bg-secondary/80 transition disabled:opacity-50 border border-border">
                  {isLoading ? "Sending..." : "Send OTP via SMS"}
                </button>
              </form>
            </div>
          )}

          {/* ===== OTP VERIFY ===== */}
          {view === "otp-verify" && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <h2 className="text-lg font-semibold">Verify OTP</h2>
              <p className="text-sm text-muted-foreground">Enter the OTP sent to {otpPhone}</p>
              {renderError()}
              {renderSuccess()}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-1.5 block">OTP Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="text" value={otpCode} onChange={e => setOtpCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 tracking-widest text-center text-lg"
                    placeholder="000000" required maxLength={6} />
                </div>
              </div>
              <button type="submit" disabled={isLoading}
                className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50">
                {isLoading ? "Verifying..." : "Verify & Sign In"}
              </button>
              <button type="button" onClick={() => handleSendPhoneOtp({ preventDefault: () => {} } as React.FormEvent)}
                className="w-full text-sm text-muted-foreground hover:text-primary transition">
                Resend OTP
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
