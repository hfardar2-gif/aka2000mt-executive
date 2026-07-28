import { useEffect, useState } from "react";

type DeferredInstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);
const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);

export function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<DeferredInstallPrompt | null>(null);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    navigator.serviceWorker.register("/sw.js").then((registration) => {
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) setUpdateReady(true);
        });
      });
    }).catch(() => undefined);

    const beforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as DeferredInstallPrompt);
    };

    window.addEventListener("beforeinstallprompt", beforeInstall);
    if (isIos() && !isStandalone()) setShowIosHelp(true);
    return () => window.removeEventListener("beforeinstallprompt", beforeInstall);
  }, []);

  if (isStandalone() || (!installPrompt && !showIosHelp && !updateReady)) return null;

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  const reloadForUpdate = async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
    window.location.reload();
  };

  return (
    <aside className="no-print fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-[100] mx-auto max-w-md rounded-2xl border border-[#D9E0E8] bg-white p-4 shadow-[0_12px_36px_rgba(23,54,93,0.16)] dark:border-border dark:bg-card">
      <div className="flex items-start gap-3">
        <img src="/aka-app-icon.svg" alt="AKA" className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#17365D] dark:text-foreground">
            {updateReady ? "نسخهٔ جدید آماده است" : "نصب داشبورد روی موبایل"}
          </p>
          <p className="mt-1 text-xs leading-6 text-[#66717E] dark:text-muted-foreground">
            {updateReady
              ? "برای دریافت آخرین نسخه، صفحه را به‌روزرسانی کنید."
              : showIosHelp
                ? "در Safari روی Share بزنید و سپس Add to Home Screen را انتخاب کنید."
                : "داشبورد را مانند یک اپ مستقل روی صفحهٔ اصلی نصب کنید."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {updateReady ? (
              <button type="button" onClick={reloadForUpdate} className="min-h-11 rounded-lg bg-[#17365D] px-4 text-xs font-semibold text-white">
                به‌روزرسانی
              </button>
            ) : installPrompt ? (
              <button type="button" onClick={install} className="min-h-11 rounded-lg bg-[#17365D] px-4 text-xs font-semibold text-white">
                نصب اپ
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => {
                setInstallPrompt(null);
                setShowIosHelp(false);
                setUpdateReady(false);
              }}
              className="min-h-11 rounded-lg border border-[#D9E0E8] px-4 text-xs font-semibold text-[#66717E] dark:border-border dark:text-muted-foreground"
            >
              بعداً
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
