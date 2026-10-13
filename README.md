# Publisher Pulse · US Appliance Monitor

미국 대상 퍼블리셔의 공개 지면과 가전·TV 브랜드 활동을 일별로 관측하는 GitHub Pages 대시보드.

- Dashboard: https://hazajous-code.github.io/us-publisher-pulse/
- Collection date: 2026-10-12, Asia/Seoul (KST)
- Initial sample: 27 publisher/service names, 32 selected URLs, 30 actual browser screenshots, 12 manually reviewed observations.
- Source-name register: 275 original names from a previously analyzed publisher aggregate; this is not 275 independent publishers.
- No internal sales, commissions, customer records, or order data are included.

## Evidence and limits

The first snapshot was captured in a real desktop browser. Screenshots are viewport images; the corresponding visible DOM text was inspected to read content further down the page. Full article bodies are not published. US IP country could not be verified, so all initial records explicitly state US IP unverified. A US edition or dollar price does not prove a US network location.

Public store pages, editorial content, login entrances, challenges, failed rendering, missing pages, and browser-policy rejections are separate statuses. RetailMeNot and CNET were blocked by the collection browser policy and are excluded from automatic targets. No bypass or CAPTCHA solving is implemented. CouponFollow includes mixed currencies and is excluded from the reviewed US rate comparison.

A captured homepage does not prove all appliance placements were collected. Company-name normalization is a candidate mapping, not proof of CJ account ownership. The 275-name reference comes from a single existing aggregate, not every historical file. Unmapped identifiers, app/extension channels and member portals remain visible in Coverage.

LG is the comparison brand. Samsung, GE Appliances, Whirlpool, Dyson, Frigidaire and TV review brands are tracked. A mention is not paid advertising or share of voice. Cashback rates have different exclusions; no transaction eligibility is asserted.

## Daily schedule

GitHub Actions runs at 22:00 UTC every day, equivalent to 07:00 KST the next day (18:00 EDT / 17:00 EST). GitHub schedules can be delayed. Public-repository scheduled workflows may be disabled by GitHub after inactivity; check Actions periodically.

The collector uses fresh Chromium, en-US language, New York timezone and a fixed 1440 × 1000 viewport. It checks its outgoing country through ipapi.co using the same browser context and records only country code, never IP address. A runner location is not assumed to be US.

Optional repository secrets for an authorized US proxy: US_PROXY_SERVER, US_PROXY_USERNAME, US_PROXY_PASSWORD. Without a confirmed US country the observation is labeled unverified or non-US. Locale/timezone is not geographic verification. No member login is performed.

Each KST date is immutable. Rerunning on the same date keeps the first snapshot. New snapshots contain automatically detected brand names with reviewed=false and no manually verified offer rows. Inspect screenshots before adding reviewed observations. Hash comparisons identify body changes, including personalization or moving widgets, not necessarily campaign changes.

## Files

- dist/: published dashboard and snapshots
- dist/data/YYYY-MM-DD.json: outcomes, reviewed observations, source-name registry
- dist/captures/: actual JPEG evidence
- targets.json: public targets and entry-only scope
- scripts/capture.mjs: daily browser collector
- scripts/verify.mjs: data integrity and reference checks
- .github/workflows/: deployment and daily collection

## Run

Requires Node.js 22+. Run npm ci, npx playwright install --with-deps chromium, npm run verify, then npm run capture.
Serve dist/ with any static HTTP server; node scripts/serve.mjs provides a local preview. Paths are relative for GitHub Pages project hosting.

## Operating checks

Inspect Actions, then the new date in the dashboard. Failed captures never count as successful content observations. A first-day dataset has no prior-day change metric. Screenshots retain publisher branding and link to the original source; the dashboard records observations rather than redistributing entire articles.

## LG comparison update (2026-10-13)

The overview compares LG and competitors within the same publisher and benefit type. Maximum rates stay separate from ordinary rates; displayed percentage-point differences do not establish identical purchase eligibility. Cashback candidates come only from explicit Rakuten/BeFrugal brand-store titles and are labelled unreviewed. Historical reviewed values take precedence. Coupon discounts and membership offers remain separate. Missing observations never become zero rates or ended offers.

Publisher and brand filters affect the overview, rate history and capture board. Coverage retains the complete source-name register. The last 14 observation dates are displayed with links to dated screenshots. Eleven additional brand-store targets are configured for the next daily collection; historical snapshots are unchanged. Run npm test for comparison safeguards.

## Private tracker reconciliation

The Tracker tab reads tab-separated .txt/.tsv files or pasted tables in browser memory. It never uploads or persists the table. Only placement-identification fields are retained; commercial metrics are discarded. Reconciliation uses all archived snapshots and defaults to US Eastern capture dates. Alias matching is not CID verification. Brand/date overlap is a review candidate, never proof of paid placement. Email/app/member placements require separate evidence. Raw attachments and local reports stay outside dist in ignored .artifacts.
