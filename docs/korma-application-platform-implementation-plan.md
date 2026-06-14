# KORMA-USA Application Platform Implementation Plan

Source backlog: `/Users/frankclay/Downloads/KORMAUSA_Linear_User_Stories.csv`

Repo: `frankclay-SQG/kormausa-com`
Local path: `/Users/frankclay/Documents/kormausa-com`
Production Vercel project: `kormausa-com`
Production commit at planning time: `62f10286bb266ab27b52e8edd2cf7ec1c7ccd418`

## Linear Import Status

Linear import is pending because the Linear connector is listed in Codex but its issue/project tools are not currently exposed in this session.

When Linear is available, import the 26 CSV rows as:

- 5 Linear projects or parent epics:
  - KORMA-EPIC-1: Applicant Accounts and Role-Based Access
  - KORMA-EPIC-2: Unified Application Builder
  - KORMA-EPIC-3: Documents, Headshots, and Signatures
  - KORMA-EPIC-4: Submission, Review, and CRM Package
  - KORMA-EPIC-5: Administration, Compliance, and Quality
- 20 implementation stories
- 1 spike: KORMA-9, Google Workspace digital-signature integration

Preserve CSV fields in Linear issue descriptions:

- Description
- User Story
- Acceptance Criteria
- Dependencies
- Codex Notes

Use labels from the CSV exactly where possible. If labels do not exist in Linear, create them before issue import.

## Current Product Baseline

The current application is a public Next.js 15 / React 19 marketing and conversion site using App Router, Tailwind, shadcn-style UI components, HubSpot REST API calls, Stripe Checkout, Stripe promotion-code validation, and a Stripe webhook.

Current live workflows:

- Public homepage sections: hero, programs, about, seminars, contact, footer
- Contact form creates HubSpot contact and deal
- Certification form creates HubSpot contact and deal
- Waiver form creates HubSpot contact and engagement note
- Enrollment flow creates HubSpot contact and either:
  - free/quote HubSpot deal
  - Stripe Checkout session for paid programs
- Stripe webhook creates a closed-won HubSpot deal for paid enrollment

Missing foundations required by the backlog:

- Authentication
- Persistent application database
- Role-based access control
- Applicant dashboard
- Draft/autosave data model
- Private file storage
- Upload scanning hook
- Admin/reviewer workspace
- Audit trail
- Job/retry queue
- Configurable rules and templates
- Automated tests and CI

## Recommended Architecture

Keep the app on Next.js App Router and Vercel. Add the missing platform services in a way that preserves the current HubSpot and Stripe integrations.

### Core Services

- Auth: use a production auth library rather than custom auth. The preferred options are Auth.js/better-auth if keeping auth fully in-app, or Clerk if accepting a managed auth dependency.
- Database: Postgres through Vercel Marketplace, preferably Neon, because Vercel Postgres itself is no longer offered for new projects.
- ORM/migrations: Prisma or Drizzle. Prefer Prisma if the team wants faster schema readability and generated client types; prefer Drizzle if the team wants lighter SQL-first migrations.
- File storage: Vercel Blob private storage for headshots, forms, credential evidence, generated packages, and signed forms.
- CRM adapter: keep HubSpot integration behind a `CRMProvider` interface so submitted applications can sync idempotently.
- Signature adapter: create a `SignatureProvider` interface and implement it only after KORMA-9 confirms the supported Google Workspace flow.
- Queue/retry: start with database-backed job records and Vercel Cron or a server action processor. Move to a dedicated queue only if package generation, virus scanning, or CRM retries outgrow the simple model.
- Audit: append-only audit table for critical actor/action/target events.

### Notes From Current Platform Guidance

- Vercel now directs new Postgres usage through Marketplace integrations such as Neon.
- Vercel Blob supports public and private access modes. Private storage is the right fit for applicant documents because reads require authentication.
- Vercel signed URLs are now available for Blob and should be used for time-limited upload/download flows.
- Next.js documentation recommends using an auth library for production features such as session management, authorization, MFA, and role-based access.

Reference docs:

- https://vercel.com/docs/postgres
- https://vercel.com/docs/storage
- https://vercel.com/docs/vercel-blob
- https://vercel.com/docs/vercel-blob/vercel-signed-urls
- https://nextjs.org/docs/app/guides/authentication

## Data Model Slice

Initial entities:

- User
- Account/Profile
- Role
- Application
- ApplicationService
- MartialArt
- RankLevel
- School
- SchoolApplicationDetail
- CredentialRequest
- InstructorCertificationRequest
- DocumentTemplate
- DocumentRequirement
- Document
- DocumentVersion
- SignatureRequest
- ReviewDecision
- AmendmentRequest
- CRMExport
- PackageGenerationJob
- AuditEvent

Important modeling rules:

- `Application` is the parent record.
- `ApplicationService` stores each selected service and service-level state.
- Credential and instructor requests are service-level child records.
- Submitted applications must create immutable snapshots.
- Document status should be derived from requirements plus document records, not duplicated as a separate checklist.
- Config/rule changes must be versioned so submitted applications retain the rules used at submission.

## Delivery Phases

### Phase 0: Foundation Decisions And Setup

Linear issues:

- KORMA-9

Outcomes:

- Confirm Google Workspace signing approach.
- Choose auth provider.
- Choose ORM.
- Provision Postgres.
- Provision private Blob store.
- Decide malware scanning provider or scanning stub/future hook.
- Document privacy and retention assumptions.

Exit criteria:

- Decision record committed.
- Required Vercel environment variables identified.
- No implementation starts that depends on unsupported Google signing APIs.

### Phase 1: Auth, Profile, Audit, And Platform Skeleton

Linear issues:

- KORMA-1
- KORMA-2
- KORMA-20

Build:

- Registration, verification, login, logout, password reset.
- Applicant, reviewer, administrator roles.
- Server-side authorization helpers.
- Applicant profile and profile dashboard shell.
- Audit event writer and redacted logging helpers.
- Initial migrations and seed data.

Exit criteria:

- Verified users can access their dashboard.
- Unverified users can draft but cannot submit.
- Users cannot access records outside their role.
- Critical auth/profile changes emit audit events.
- Tests cover registration, verification, role checks, and audit writing.

### Phase 2: Application Draft Builder

Linear issues:

- KORMA-3
- KORMA-4
- KORMA-5
- KORMA-6
- KORMA-7
- KORMA-8
- KORMA-19, partial

Build:

- Multi-step application wizard.
- Service selection cards for school registration, rank registration, and instructor certification.
- Martial art and rank reference tables.
- School details.
- Rank registration details.
- Instructor certification details.
- Autosave with visible save state.
- Resume draft from last completed step.
- Optimistic concurrency using `updated_at` or a version column.

Exit criteria:

- Applicant can create a combined-service draft.
- Service-specific data appears only when relevant.
- Draft survives sign-out/sign-in.
- Removing a service warns before deleting service-specific draft data.
- Admin-configured arts/ranks drive UI values.

### Phase 3: Documents, Uploads, And Signature Readiness

Linear issues:

- KORMA-10
- KORMA-11
- KORMA-12
- KORMA-13
- KORMA-19, remaining template/rule configuration

Build:

- Private file upload flow with signed URLs.
- Headshot preview/crop.
- Document metadata and versioning.
- Upload validation: file type, size, MIME inspection, checksum.
- Malware scanning hook with quarantine/fail states.
- Document template rules.
- Generated form download.
- Signature provider adapter.
- Document checklist derived from requirement rules.

Exit criteria:

- Mandatory documents block submission until complete.
- Replaced files preserve earlier versions.
- Reviewers can see document versions and status.
- Signature status can be represented even if the provider integration starts as a manual fallback.

### Phase 4: Submission, CRM Sync, And Review Workspace

Linear issues:

- KORMA-14
- KORMA-15
- KORMA-16
- KORMA-18

Build:

- Final review page.
- Server-side completeness validation.
- Attestation and immutable application snapshot.
- CRM sync adapter for HubSpot.
- Idempotent external IDs and retry-safe sync.
- Reviewer dashboard.
- Service-level review states.
- Internal notes and applicant-visible requests.
- Scoped amendment requests.

Exit criteria:

- Submitted applications are locked.
- HubSpot receives approved fields and secure links without uncontrolled duplicates.
- Reviewers can approve/reject/request more information per service.
- Applicants can respond only to scoped amendment requests.
- All material transitions are audited.

### Phase 5: Package Generation, Accessibility, Tests, And Launch Hardening

Linear issues:

- KORMA-17
- KORMA-21
- KORMA-EPIC-5 completion

Build:

- Consolidated application package generation.
- Manifest with document versions, checksums, generation timestamp.
- ZIP or approved package format.
- Package download audit.
- Workflow integration tests.
- Accessibility pass for forms, navigation, errors, focus, labels, contrast, and keyboard use.
- CI gates.

Exit criteria:

- Authorized staff can generate and download a complete package.
- Package generation is repeatable and does not mutate source records.
- E2E tests cover Taekwondo, Hapkido, and Kumdo paths.
- CI blocks merges when required tests fail.
- Manual keyboard and responsive checks pass.

## First Engineering Branch

Branch name:

`codex/korma-platform-foundation`

Scope:

- Add decision record.
- Add dependency/provider stubs.
- Add schema/migration scaffolding after DB and ORM are selected.
- Implement auth only after provider selection.

Do not start with:

- File upload implementation before private storage is provisioned.
- Google signature implementation before KORMA-9 is complete.
- Admin UI before auth, roles, and audit exist.
- CRM package generation before submission snapshots and documents exist.

## Risks And Open Decisions

1. Linear connector availability
   - Import cannot complete until Linear issue/project tools are exposed.

2. Auth provider choice
   - Managed auth is faster; in-app auth gives more ownership but more security responsibility.

3. Google Workspace signature feasibility
   - Direct e-signature automation must be validated before implementation.

4. File scanning
   - The backlog requires malware scanning. A provider or operational fallback must be selected.

5. HubSpot as CRM vs system of record
   - The website database should be the system of record unless explicitly changed.

6. Local tooling
   - This Codex environment currently has Node but no npm/pnpm/yarn on PATH, so local build verification is blocked until package tooling is available.

## Linear Import Template

Use this issue body template for each CSV row:

```markdown
Source ID: <Issue ID>
Type: <Type>
Priority: <Priority>
Estimate: <Estimate>
Parent Epic: <Parent Epic>
Dependencies: <Dependencies>
Labels: <Labels>

## Description
<Description>

## User Story
<User Story>

## Acceptance Criteria
<Acceptance Criteria>

## Codex Notes
<Codex Notes>
```

For epics, create the parent project/epic first and then attach child stories. If Linear's workspace does not support parent/child issues in the exposed connector, include `Parent Epic: <id>` at the top of each child issue body and group by label.
