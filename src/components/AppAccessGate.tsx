import { useEffect, useState, type FormEvent, type ReactNode } from "react";

const REQUEST_TIMEOUT_MS = 8000;

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}) => {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeout);
  }
};

export function AppAccessGate({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const forceEnglish = () => {
    localStorage.setItem("lang", "en");
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  };

  useEffect(() => {
    let cancelled = false;

    const checkSession = async () => {
      try {
        const response = await fetchWithTimeout(`/api/app-auth?t=${Date.now()}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
          headers: { Accept: "application/json" },
        });
        const result = (await response.json().catch(() => ({}))) as {
          authenticated?: boolean;
          message?: string;
        };
        if (cancelled) return;
        if (response.ok && result.authenticated) {
          forceEnglish();
          setAuthenticated(true);
        } else if (!response.ok) {
          setMessage(result.message || "Authentication service is unavailable.");
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof DOMException && error.name === "AbortError"
              ? "The access check took too long. Please enter your password."
              : "Authentication service is unavailable. Please enter your password.",
          );
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!password || submitting) return;
    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetchWithTimeout("/api/app-auth", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ action: "login", password }),
      });
      const result = (await response.json().catch(() => ({}))) as {
        authenticated?: boolean;
        message?: string;
      };
      if (!response.ok || !result.authenticated) {
        throw new Error(result.message || "Incorrect password.");
      }

      forceEnglish();
      setPassword("");
      setAuthenticated(true);
    } catch (error) {
      setMessage(
        error instanceof DOMException && error.name === "AbortError"
          ? "The sign-in request timed out. Please try again."
          : error instanceof Error
            ? error.message
            : "Incorrect password.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4" dir="ltr">
        <div className="text-center">
          <img src="/aka-app-icon.svg" alt="AKA" className="mx-auto h-16 w-16 rounded-2xl" />
          <p className="mt-4 text-sm text-muted-foreground">Checking access…</p>
          <button
            type="button"
            onClick={() => setChecking(false)}
            className="mt-5 min-h-11 rounded-lg border border-border bg-card px-4 text-sm font-medium text-foreground"
          >
            Enter password manually
          </button>
        </div>
      </main>
    );
  }

  if (!authenticated) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-4 py-10" dir="ltr">
        <form
          onSubmit={submit}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-left shadow-[var(--shadow-card)]"
        >
          <img src="/aka-app-icon.svg" alt="AKA" className="h-16 w-16 rounded-2xl" />
          <h1 className="mt-5 text-2xl font-semibold text-foreground">AKA Executive Dashboard</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Enter the application password to continue.
          </p>

          <label className="mt-6 block">
            <span className="text-sm font-medium text-foreground">Password</span>
            <input
              autoFocus
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none focus:ring-2 focus:ring-ring"
              placeholder="Enter password"
            />
          </label>

          {message ? (
            <p className="mt-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting || !password}
            className="mt-5 min-h-12 w-full rounded-lg bg-primary px-4 font-semibold text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </main>
    );
  }

  return children;
}
