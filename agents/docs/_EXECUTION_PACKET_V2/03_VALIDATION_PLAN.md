# Passive SaaS Validation Plan — V2

## Goal
Validate demand for a **$500–$2k/mo** "Composable Pricing Data OS for SaaS" **without** active outreach while we ship the e‑comm MVP.

## Assets
- **Collector Page**: SaaS‑focused landing with pricing anchor + form (company, stack, size).
- **SEO Content**: 3–4 pieces (e.g., "Stop hard‑coding pricing", "Alternatives to monolithic billing").
- **Tracking**: PostHog/Plausible + UTM tags; store firmographics to a `saaS_interest` table.

## Signals & Thresholds (Pivot Gate)
- **Go**: ≥ 25 qualified sign‑ups (company size ≥ 10; billing via Stripe) **and** ≥ 10 with usage pricing in 90 days.  
- **Hold**: < 10 qualified sign‑ups; continue e‑comm focus; revisit in 90 days.

## Process
1. Ship collector page behind `/saas` route; add to sitemap.  
2. Publish SEO posts; internal links only (no paid).  
3. Weekly export firmographics; tag themes.  
4. Prepare Stripe connector design only when **Go** threshold met.

## Data Retention & Privacy
- Store minimal PII; consent checkbox; separate table.  
- Delete on request; docs in `/docs/privacy/saas_collector.md`.

