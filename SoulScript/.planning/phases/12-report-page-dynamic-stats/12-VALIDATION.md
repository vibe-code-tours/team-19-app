---
phase: 12
slug: report-page-dynamic-stats
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-07-17
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm run test` |
| **Full suite command** | `npm run test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run test`
- **After every plan wave:** Run `npm run test`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | R7, R8 | T-12-02 | Month format validation | tdd | `npm run test -- __tests__/lib/report-stats.test.ts` | No (Wave 0) | pending |
| 12-01-02 | 01 | 1 | R8 | T-12-01, T-12-03 | Auth check, column filtering | unit | `npm run test -- __tests__/api/report.test.ts` | Yes (POST only) | pending |
| 12-02-01 | 02 | 2 | R8 | T-12-05 | Regex validation in enabled guard | unit | `npm run test -- __tests__/hooks/useReport.test.tsx` | No (Wave 0) | pending |
| 12-02-02 | 02 | 2 | R7, R8 | — | N/A (UI rendering) | build | `npm run build` | Yes | pending |

*Status: pending · green · red · flaky*

---

## Wave 0 Requirements

- [x] Existing test infrastructure covers all phase requirements

*Existing Vitest setup covers API route tests and component tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Report page renders real data from API | R7 | Visual verification needed | Navigate to /report, verify stats match DB |
| Mood distribution bar chart displays correctly | R8 | Visual rendering check | Check percentages add to 100%, bars render |
| Loading skeleton appears during fetch | R8 | Visual timing check | Navigate to /report, observe skeleton before data loads |
| Empty state hides AI sections when <10 entries | R8 | Conditional rendering check | Navigate to /report with a month that has <10 entries |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
