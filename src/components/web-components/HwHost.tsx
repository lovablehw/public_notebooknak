/*
  MANUAL CODE
  Do not modify this file!
 */

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client.ts";
import { Session } from '@supabase/supabase-js';

interface HwAuthTokenPair {
  accessToken: string;
  refreshToken?: string;
}

type HwHostRef = HTMLElement & {
  authTokens: HwAuthTokenPair;
  onTokensRefreshed?: (accessToken: string, refreshToken: string) => void;
  onTokenRefreshError?: (error: Error) => void;
  onTokensExpired?: () => void;
};

const SUPABASE_SESSION_KEY_PATTERN = /sb-.*-auth-token/gi;

export function HwHost() {
  const hostRef = useRef<HTMLElement | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  // Update the Supabase session with the refreshed Keycloak tokens
  const onTokensRefreshed = (accessToken: string, refreshToken: string) => {
    const key: string | undefined = Object.keys(localStorage).find((key) => SUPABASE_SESSION_KEY_PATTERN.test(key));
    if (!key) return;

    const raw = localStorage.getItem(key);
    if (!raw) return;

    const session = JSON.parse(raw) as Session;
    session.provider_token = accessToken;
    session.provider_refresh_token = refreshToken;
    localStorage.setItem(key, JSON.stringify(session));
  };

  const onTokenRefreshError = (error: Error) => {
    console.error("HwHost: failed to refresh tokens", error);
    supabase.auth.signOut().then();
  }

  const onTokensExpired = () => {
    console.error("HwHost: tokens have expired");
    supabase.auth.signOut().then();
  }

  // Append script containing the web components to the <body> upon loading this component
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "/web-components/web-components.js";
    script.type = "text/javascript";
    script.defer = true;
    if (!document.body.contains(script)) {
      document.body.appendChild(script);
    }

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  /*
   * Retrieve the access token and subscribe to auth state changes
   * There are two kinds of tokens stored in the Supabase session:
   * - access_token and refresh_token are issued by Supabase
   * - provider_token and provider_refresh_token are issued by Keycloak
   * The Medalyse middleware only accepts the latter, so that's what gets passed to <hw-host>
  */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setAccessToken(data.session?.provider_token ?? null);
      setRefreshToken(data.session?.provider_refresh_token ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === "SIGNED_OUT" && hostRef.current) {
        // Notify web components about the user logging out
        hostRef.current.dispatchEvent(new CustomEvent("hwlogout"));
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Pass tokens and event listeners to <hw-host> when the tokens become available
  useEffect(() => {
    const host = hostRef.current as HwHostRef;
    if (host && accessToken && refreshToken) {
      host.onTokensRefreshed = onTokensRefreshed;
      host.onTokenRefreshError = onTokenRefreshError;
      host.onTokensExpired = onTokensExpired;
      host.authTokens = {
        accessToken: accessToken,
        refreshToken: refreshToken
      };
    }
  }, [accessToken, refreshToken]);

  return (
    <hw-host
      ref={hostRef}
      apiUrl="http://medalyse.gamma.local/mw"
      appName="medalyse3app"
      clientId="SFF_TEST"
      styles="/web-components/web-component-styles.css"
      documentServerUrl="http://medalyse.gamma.local/onlyoffice"
      assets="/web-components/assets"
      darkMode={false}
    />
  );
}