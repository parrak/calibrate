# Deprecated E-Commerce Documentation

**Archived**: February 13, 2026  
**Reason**: Strategic pivot from e-commerce pricing platform to SaaS revenue mutation governance

## Context

These documents represent the original execution plan for Calibrate as a **Composable Pricing Data OS** with an **e-commerce wedge** (Shopify/Amazon connectors, bulk pricing automation).

On February 13, 2026, the strategic direction shifted to focus on **Revenue Mutation Governance for AI-Native SaaS**, emphasizing:
- Discount approval workflows
- Plan price change governance
- Expected vs. realized outcome tracking

## Archived Files

- `00_EXEC_SUMMARY_ECOMMERCE.md` - Original executive summary (e-commerce focus)
- `01_MILESTONES_ECOMMERCE.md` - Original milestone structure (M0.1-M1.9)
- `NEXT_TASK_PLAN_ECOMMERCE.md` - Original Q1 2026 task plan

## Why Archive?

The existing codebase (1,162 commits, event-sourced governance, deployed infrastructure) provides a strong foundation for the mutation lifecycle system. The work completed in M0.1-M1.9 is not wasted—it established:

- Event-first architecture (append-only log, outbox pattern)
- Multi-tenant RLS and security
- Explainability and audit trails
- Connector pattern (adaptable to Stripe)
- Governance workflows (preview → approve → apply → rollback)

These documents are preserved for historical context and potential future reference if e-commerce becomes relevant again.

## Current Documentation

See `agents/docs/_EXECUTION_PACKET_V2/` for the current mutation lifecycle strategy.
