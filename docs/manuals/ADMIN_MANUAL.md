# Kerala Police Cyber Division — SmartQEye Administrator Manual

## 1. Scope & Security Clearance
This manual defines procedures for System Administrators and Model Custodians managing SmartQEye Coastal.

## 2. Role-Based Access Control (RBAC)
- **OPERATOR**: Live monitoring, preliminary alert acknowledgement, report viewing.
- **ANALYST**: Deep forensic playback, watchlist querying, ELIR dossier editing.
- **SUPERVISOR**: Tactical escalation, interceptor dispatch authorisation, evidence signing.
- **MODEL_CUSTODIAN**: Model registry maintenance, evaluation validation, offline training runs.
- **SYS_ADMIN**: Officer profile provisioning, session termination, legal hold control.
- **AUDITOR**: Read-only tamper-seal verification across Section 65B ledgers.

## 3. Evidence Packaging & Section 65B
- Cryptographic SHA-256 integrity verification across media files and metadata.
- Generated ZIP packages contain court-admissible certificates conforming to Section 65B of the Indian Evidence Act.
- Immutable hash ledger prevents retro-active alteration of police audit trails.
