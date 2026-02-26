

## Plan: SSO-only Auth with Age Gate

### Summary
Replace email/password forms with a single SSO button behind an age verification modal. Legacy code preserved via feature flag.

### Files to modify

**1. `src/pages/Login.tsx`**
- Add `const isLegacyAuthEnabled = false;` flag
- Wrap the email/password form, divider, Keycloak button, forgot-password link, and register link inside `{isLegacyAuthEnabled && (...)}`
- When `!isLegacyAuthEnabled`: render a single "Bejelentkezés / Regisztráció" primary `<Button>` that sets `showAgeGate = true`
- Add `showAgeGate` state + age gate modal (using `AlertDialog` from radix):
  - Title: "Korhatár ellenőrzés"
  - Text: "A szolgáltatás használatához igazolnod kell, hogy elmúltál 18 éves."
  - Checkbox: "Elmúltam 18 éves"
  - Confirm button (disabled until checkbox checked)
  - On confirm:
    1. Call `supabase.rpc('log_audit_event', { p_event_type: 'age_verification', p_metadata: { age_verified: true } })` — but user is not yet authenticated, so this RPC will fail. **Resolution**: skip the RPC call pre-auth (user has no `auth.uid()` yet). Instead, log the age verification **after** Keycloak returns, inside the `onAuthStateChange` handler or on the consent page.
    2. **Revised approach**: Store age verification intent in sessionStorage, proceed with Keycloak SSO. After successful auth callback, log the audit event.
    3. Call `signInWithKeycloak()` to initiate the OAuth flow.

**Wait — the `log_audit_event` RPC requires authentication (`auth.uid()` must not be null). The age gate happens before login. Two options:**

- **Option A**: Log the audit event after Keycloak returns (in `useAuth` or Login page's `useEffect` when user becomes authenticated). Read flag from `sessionStorage`.
- **Option B**: Create an unauthenticated edge function for age verification logging.

Option A is simpler and more secure (ties the event to the actual user). Will use this approach.

### Implementation Steps

**1. `src/pages/Login.tsx`** — Main changes
- Add `isLegacyAuthEnabled = false` constant
- Add `showAgeGate` state
- New SSO flow UI: single button → age gate AlertDialog → Keycloak
- On age gate confirm: set `sessionStorage.setItem('age_verified', 'true')`, call `signInWithKeycloak()`
- Wrap legacy UI in conditional

**2. `src/pages/Register.tsx`** — Same pattern
- Add `isLegacyAuthEnabled = false`
- Wrap legacy form in conditional
- When `!isLegacyAuthEnabled`: show same "Bejelentkezés / Regisztráció" button + age gate, redirect to `/login` logic (or handle inline)
- Simplest: when `!isLegacyAuthEnabled`, redirect to `/login` since SSO handles both

**3. `src/hooks/useAuth.tsx`** — Post-auth age verification audit
- In `onAuthStateChange` `SIGNED_IN` handler: check `sessionStorage.getItem('age_verified')`
- If truthy, call `supabase.rpc('log_audit_event', ...)` with age_verification event, then remove from sessionStorage

**4. `src/pages/Landing.tsx`** — Update CTAs
- Change "Fiók létrehozása" and "Bejelentkezés" links to both point to `/login` (since SSO handles registration too)
- Or keep as-is since `/register` will redirect to `/login`

**5. No database changes needed** — `log_audit_event` RPC already exists and accepts the required parameters.

### Technical Details

```text
User Flow:
  Landing ──→ /login
                │
                ├─ Click "Bejelentkezés / Regisztráció"
                │
                ├─ Age Gate Modal appears
                │   ├─ Check "Elmúltam 18 éves"
                │   └─ Click "Tovább"
                │       ├─ sessionStorage.set('age_verified', 'true')
                │       └─ signInWithKeycloak()
                │           └─ Keycloak redirect
                │
                ├─ Return from Keycloak (SIGNED_IN event)
                │   ├─ useAuth reads sessionStorage → logs audit event
                │   └─ Login useEffect checks consent
                │       ├─ needsConsent → /consent (new user)
                │       └─ !needsConsent → /healthbook (existing user)
```

### Files changed
| File | Change |
|------|--------|
| `src/pages/Login.tsx` | Feature flag, age gate modal, SSO-only UI |
| `src/pages/Register.tsx` | Feature flag, redirect to `/login` when legacy disabled |
| `src/hooks/useAuth.tsx` | Post-auth age verification audit logging |
| `src/pages/Landing.tsx` | Update CTA links to `/login` |

