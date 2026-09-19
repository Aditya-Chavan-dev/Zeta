# ZETA Fault & Postmortem Repository

This folder maintains an unvarnished, engineering-grade record of all operational, behavioral, and architectural failures encountered during ZETA development.

## Index of Records
- [`INCIDENT_RECORDS.md`](./INCIDENT_RECORDS.md): Full postmortem analysis of all 7 critical faults (FLT-01 through FLT-07), covering symptoms, root causes, systemic impacts, and verified engineering fixes.

## Incident Log Standard
Every fault documented in this directory follows the blameless postmortem standard:
1. **Identification**: Unique ID, component affected, and failure classification.
2. **Symptom**: Observed behavior from the user or developer perspective.
3. **Root Cause**: Architectural or logic flaw that caused the behavior.
4. **Impact**: How the failure degraded safety, user experience, or architectural rigor.
5. **Mitigation**: Specific code and rule changes implemented to prevent recurrence.
