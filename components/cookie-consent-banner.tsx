"use client";

import { useEffect, useState } from "react";
import { Cookie, Settings } from "lucide-react";

type ConsentState = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

const CONSENT_STORAGE_KEY = "korma-cookie-consent";
const CONSENT_COOKIE_NAME = "korma_cookie_consent";
const CONSENT_COOKIE_MAX_AGE = 60 * 60 * 24 * 180;

function readStoredConsent() {
  if (typeof window === "undefined") return null;

  const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored) as ConsentState;
  } catch {
    return null;
  }
}

function persistConsent(consent: ConsentState) {
  if (typeof window === "undefined") return;

  const serialized = JSON.stringify(consent);
  window.localStorage.setItem(CONSENT_STORAGE_KEY, serialized);
  document.cookie = `${CONSENT_COOKIE_NAME}=${encodeURIComponent(
    serialized
  )}; path=/; max-age=${CONSENT_COOKIE_MAX_AGE}; SameSite=Lax`;
}

function createConsent(overrides?: Partial<Omit<ConsentState, "necessary" | "updatedAt">>): ConsentState {
  return {
    necessary: true,
    analytics: overrides?.analytics ?? false,
    marketing: overrides?.marketing ?? false,
    updatedAt: new Date().toISOString(),
  };
}

export function CookieConsentBanner() {
  const [mounted, setMounted] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [marketingEnabled, setMarketingEnabled] = useState(false);

  useEffect(() => {
    const storedConsent = readStoredConsent();
    setMounted(true);

    if (storedConsent) {
      setAnalyticsEnabled(storedConsent.analytics);
      setMarketingEnabled(storedConsent.marketing);
      return;
    }

    setBannerOpen(true);
  }, []);

  const hasConsent = mounted && !bannerOpen;

  function saveConsent(consent: ConsentState) {
    persistConsent(consent);
    setAnalyticsEnabled(consent.analytics);
    setMarketingEnabled(consent.marketing);
    setBannerOpen(false);
    setPreferencesOpen(false);
  }

  if (!mounted) return null;

  return (
    <>
      {bannerOpen ? (
        <div className="fixed bottom-4 left-4 z-[35] w-[calc(100vw-2rem)] max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:bottom-6 sm:left-6">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-white">
              <Cookie className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Cookie Preferences
              </div>
              <h3 className="mt-2 text-lg font-black text-slate-950">
                We use necessary cookies to keep the site working.
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Optional analytics and marketing cookies stay off unless you
                allow them. You can change this choice at any time.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPreferencesOpen((current) => !current)}
              className="rounded-full border border-slate-200 p-2 text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-900"
              aria-label="Customize cookie settings"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>

          {preferencesOpen ? (
            <div className="mt-4 space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <PreferenceRow
                title="Necessary"
                description="Required for core site behavior and saving your consent choice."
                checked
                disabled
              />
              <PreferenceRow
                title="Analytics"
                description="Allows measurement tools if we enable them later."
                checked={analyticsEnabled}
                onChange={setAnalyticsEnabled}
              />
              <PreferenceRow
                title="Marketing"
                description="Allows advertising or remarketing tools if we add them later."
                checked={marketingEnabled}
                onChange={setMarketingEnabled}
              />
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={() =>
                saveConsent(createConsent({ analytics: false, marketing: false }))
              }
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-900 transition-colors hover:border-slate-400 hover:bg-slate-50"
            >
              Necessary Only
            </button>
            <button
              type="button"
              onClick={() =>
                saveConsent(createConsent({ analytics: true, marketing: true }))
              }
              className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
            >
              Accept All
            </button>
            <button
              type="button"
              onClick={() =>
                saveConsent(
                  createConsent({
                    analytics: analyticsEnabled,
                    marketing: marketingEnabled,
                  })
                )
              }
              className="inline-flex items-center justify-center rounded-lg border border-transparent px-4 py-3 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Save Preferences
            </button>
          </div>
        </div>
      ) : null}

      {hasConsent ? (
        <button
          type="button"
          onClick={() => {
            const storedConsent = readStoredConsent();
            if (storedConsent) {
              setAnalyticsEnabled(storedConsent.analytics);
              setMarketingEnabled(storedConsent.marketing);
            }
            setBannerOpen(true);
            setPreferencesOpen(true);
          }}
          className="fixed bottom-4 left-4 z-30 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-lg transition-colors hover:border-slate-300 hover:text-slate-950"
        >
          <Cookie className="h-4 w-4" />
          Cookie Settings
        </button>
      ) : null}
    </>
  );
}

function PreferenceRow({
  title,
  description,
  checked,
  disabled = false,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="text-sm font-semibold text-slate-900">{title}</div>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">
          {description}
        </p>
      </div>
      <button
        type="button"
        onClick={() => onChange?.(!checked)}
        disabled={disabled}
        aria-pressed={checked}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? "bg-slate-900" : "bg-slate-300"
        } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
