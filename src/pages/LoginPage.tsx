import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Shield, Lock, User, AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setTimeout(() => {
      const result = login(username, password);
      if (!result.success) setError(result.error || "Login failed");
      setIsLoading(false);
    }, 600);
  };

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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter username"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:opacity-90 transition disabled:opacity-50"
            >
              {isLoading ? "Authenticating..." : "Sign In"}
            </button>
          </form>
        </div>

        <div className="mt-6 bg-accent/10 border border-accent/20 rounded-xl p-4">
          <p className="text-xs font-semibold text-accent mb-2">Demo Credentials</p>
          <div className="space-y-1 text-xs text-muted-foreground font-mono">
            <p>Guard: <span className="text-foreground">guard1</span> / <span className="text-foreground">guard123</span></p>
            <p>Guard: <span className="text-foreground">guard2</span> / <span className="text-foreground">guard123</span></p>
            <p>Manager: <span className="text-foreground">manager</span> / <span className="text-foreground">manager123</span></p>
          </div>
        </div>

        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-patrol-amber/10 border border-patrol-amber/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-patrol-amber animate-pulse" />
            <span className="text-xs text-patrol-amber font-medium">Demo Mode — No Firebase configured</span>
          </div>
        </div>
      </div>
    </div>
  );
}
