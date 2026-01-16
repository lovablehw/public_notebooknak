import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Cookie, X, Settings } from "lucide-react";
import { Link } from "react-router-dom";

const COOKIE_CONSENT_KEY = "cookie_consent";
const COOKIE_CONSENT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export type CookiePreferences = {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
};

const defaultPreferences: CookiePreferences = {
  necessary: true, // Always required
  analytics: false,
  marketing: false,
};

export function getCookieConsent(): CookiePreferences | null {
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Invalid stored value
  }
  return null;
}

export function setCookieConsent(preferences: CookiePreferences) {
  localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(preferences));
  // Also set a cookie for server-side checks
  document.cookie = `${COOKIE_CONSENT_KEY}=accepted; path=/; max-age=${COOKIE_CONSENT_MAX_AGE}`;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences);

  useEffect(() => {
    const consent = getCookieConsent();
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted: CookiePreferences = {
      necessary: true,
      analytics: true,
      marketing: true,
    };
    setCookieConsent(allAccepted);
    setVisible(false);
  };

  const handleAcceptNecessary = () => {
    setCookieConsent(defaultPreferences);
    setVisible(false);
  };

  const handleSavePreferences = () => {
    setCookieConsent(preferences);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <Card className="mx-auto max-w-4xl bg-card border-border shadow-lg">
        <div className="p-4 md:p-6">
          <div className="flex items-start gap-4">
            <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Cookie className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    Cookie beállítások
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Weboldalunk cookie-kat használ a felhasználói élmény javítása érdekében. 
                    A szükséges cookie-k elengedhetetlenek a weboldal működéséhez.{" "}
                    <Link to="/cookie-szabalyzat" className="text-primary hover:underline">
                      Cookie szabályzat
                    </Link>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 -mt-1 -mr-1"
                  onClick={handleAcceptNecessary}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {showSettings && (
                <div className="space-y-3 rounded-lg bg-muted/50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Szükséges cookie-k</p>
                      <p className="text-xs text-muted-foreground">
                        A weboldal alapvető működéséhez szükséges
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">Mindig aktív</div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Analitikai cookie-k</p>
                      <p className="text-xs text-muted-foreground">
                        Segítenek megérteni a látogatók viselkedését
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.analytics}
                        onChange={(e) =>
                          setPreferences({ ...preferences, analytics: e.target.checked })
                        }
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Marketing cookie-k</p>
                      <p className="text-xs text-muted-foreground">
                        Személyre szabott hirdetések megjelenítéséhez
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={preferences.marketing}
                        onChange={(e) =>
                          setPreferences({ ...preferences, marketing: e.target.checked })
                        }
                      />
                      <div className="w-11 h-6 bg-muted rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-background after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-full"></div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(!showSettings)}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  {showSettings ? "Beállítások elrejtése" : "Beállítások"}
                </Button>
                
                {showSettings ? (
                  <Button size="sm" onClick={handleSavePreferences}>
                    Beállítások mentése
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" onClick={handleAcceptNecessary}>
                      Csak szükségesek
                    </Button>
                    <Button size="sm" onClick={handleAcceptAll}>
                      Összes elfogadása
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
