# AGENTS.md (scripts)

Scope: `calibrate/scripts` — operational scripts for local, staging, and docs.

## Usage
- Prefer invoking via root scripts to ensure environment flags:
  - Local verify: `pnpm verify:local`
  - Staging deploy: `pnpm staging:deploy`
  - Staging test: `pnpm staging:test`
  - Docs deploy: `pnpm docs:deploy`
- PowerShell scripts are written to tolerate `-ExecutionPolicy Bypass`.

## Agent Notes
- Do not edit scripts unless the user task requires it. These are operationally sensitive.
- If you must change a script, keep behavior backward compatible and document flags in the file header.

## Status Broadcasts
- Follow the hub guide: `../AGENTS.md#status-broadcasting`

