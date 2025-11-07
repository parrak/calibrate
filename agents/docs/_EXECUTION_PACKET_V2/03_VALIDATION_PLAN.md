# Validation Plan

## Signals & Thresholds (Pivot Gate)

- **Go**: ≥ 25 qualified sign-ups (company size ≥ 10; billing via Stripe) **and** ≥ 10 with usage pricing in 90 days.  

- **Hold**: < 10 qualified sign-ups; continue e-comm focus; revisit in 90 days.

## Process

1. Ship collector page behind `/saas` route; add to sitemap.  

2. Publish SEO posts; internal links only (no paid).  

3. Weekly export firmographics; tag themes.  

4. Prepare Stripe connector design only when **Go** threshold met.

## Implementation Notes

- Add UTM tags; track to PostHog/Plausible; persist to `saaS_interest` table

- Auto-email responder asks firmographics (company size, billing stack, whether usage pricing)

- Monthly review: If thresholds met, promote `M1.5 — Stripe Connector (Conditional)` to **active**

