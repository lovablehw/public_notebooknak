

## Plan: Create `/survey` Page with Medalyse Survey Component

### Summary
Create a new protected page at `/survey` hosting `<hw-survey-component>` with the specified data attributes, wrapped in the existing app layout pattern. Register it in the router and seed a `web_component_boxes` record.

### Implementation Steps

**1. Create `src/pages/Survey.tsx`**
- Follow the HealthBook page pattern: auth guard, consent check, header with nav (Heart logo, Settings, LogOut, Admin button)
- Render `<hw-survey-component>` inside a Card with:
  - Container `id="medalyse_survey_show"`
  - `viewId={1000047877}`, `queryId={1000043372}`, `queryName="SURVEY_DISPLAY"`
  - `className="min-h-[600px] w-full rounded-xl"`
  - `style={{ height: '-webkit-fill-available', width: '100%' }}`
- Page title: "Medalyse Kérdőív" with `ClipboardList` icon
- All labels in Hungarian

**2. Update `src/App.tsx`**
- Import `Survey` page
- Add protected route: `<Route path="/survey" element={<RequireConsent><Survey /></RequireConsent>} />`

**3. Database: Seed `web_component_boxes` record**
- Use insert tool to add: `name: 'Medalyse Kérdőív megjelenítő'`, `anchor_id: 'medalyse_survey_show'`, `is_active: false`

### Technical Notes
- No new dependencies needed
- `<hw-survey-component>` gets auth tokens automatically from `<HwHost />` (already rendered globally in `App.tsx`)
- The `viewId`/`queryId` values are placeholders per the prompt; can be changed later
- Page is within `<RequireConsent>` so HwHost context and Keycloak tokens are guaranteed available

### Files Changed
| File | Change |
|------|--------|
| `src/pages/Survey.tsx` | New page component |
| `src/App.tsx` | Add `/survey` route |
| Database | Insert `web_component_boxes` record |

