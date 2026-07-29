import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CoilInventoryEnhancer } from "../components/dashboard/CoilInventoryEnhancer";
import { PwaInstallPrompt } from "../components/PwaInstallPrompt";
import { AppAccessGate } from "../components/AppAccessGate";
import { ExecutiveReportExporter } from "../components/ExecutiveReportExporter";
import { IosExecutiveReportFix } from "../components/IosExecutiveReportFix";
import { ExecutiveReportStagePatch } from "../components/ExecutiveReportStagePatch";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "AKA Project Report" },
      { name: "description", content: "AKA Project production, inventory and management report" },
      { name: "author", content: "AKA" },
      { name: "theme-color", content: "#17365d" },
      { name: "application-name", content: "AKA Dashboard" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "apple-mobile-web-app-title", content: "AKA Dashboard" },
      { property: "og:title", content: "AKA Project Report" },
      { property: "og:description", content: "AKA Project production, inventory and management report" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "AKA Project Report" },
      { name: "twitter:description", content: "AKA Project production, inventory and management report" },
      { property: "og:image", content: "/aka-app-icon.svg" },
      { name: "twitter:image", content: "/aka-app-icon.svg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "icon", href: "/aka-app-icon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/aka-app-icon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" dir="ltr" className="light">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ProtectedApplication() {
  return (
    <>
      <CoilInventoryEnhancer />
      <PwaInstallPrompt />
      <IosExecutiveReportFix />
      <ExecutiveReportStagePatch />
      <ExecutiveReportExporter />
      <nav className="mobile-safe-header no-print sticky top-0 z-50 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-3 py-2 text-sm sm:gap-4 sm:px-6">
          <Link
            to="/"
            activeOptions={{ exact: true }}
            activeProps={{ className: "bg-primary text-primary-foreground font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-secondary hover:text-foreground" }}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-3 transition-colors"
          >
            Home
          </Link>
          <Link
            to="/data-transformer"
            activeProps={{ className: "bg-primary text-primary-foreground font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-secondary hover:text-foreground" }}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-3 transition-colors"
          >
            Data Entry
          </Link>
          <Link
            to="/report-publisher"
            activeProps={{ className: "bg-primary text-primary-foreground font-semibold" }}
            inactiveProps={{ className: "text-muted-foreground hover:bg-secondary hover:text-foreground" }}
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg px-3 transition-colors"
          >
            Excel Deploy
          </Link>
        </div>
      </nav>
      <Outlet />
    </>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AppAccessGate>
        <ProtectedApplication />
      </AppAccessGate>
    </QueryClientProvider>
  );
}
