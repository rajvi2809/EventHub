# Test Plan — EventHub Backend

## Objective

- Ensure verification, validation, and system robustness for backend APIs and models.

## Scope

- Unit tests: Model validation, utility functions.
- Integration tests: Controller endpoints and route flows (`auth`, `events`, `bookings`, `payments`, `reviews`, `users`).
- System-level: End-to-end happy paths and key failure modes for booking/payment flow.

## Test Strategy

- Unit Tests

  - Focus: data validation and model hooks (e.g., `User` password hashing, required fields).
  - Files: `tests/user.model.unit.test.js`.
  - Tools: Jest + in-memory MongoDB (mongodb-memory-server via `tests/setup.js`).

- Integration Tests

  - Focus: API endpoints, auth/authorization middleware, DB interactions.
  - Files: `tests/*.test.js` (auth, events, bookings, payments, reviews, users).
  - Approach: Use seeded data from `tests/seedData.js` and `tests/setup.js` for isolated runs.

- System Tests

  - Focus: multi-step flows (create booking -> create payment order -> verify payment -> booking status update).
  - Approach: Combine integration tests and manual exploratory runs against deployed instance.

- Performance Testing (recommended)

  - Tools: k6, Artillery, or JMeter.
  - Targets: `POST /api/bookings`, `POST /api/payments/create-order`, `GET /api/events`.
  - Metrics: RPS, p95/p99 latency, error rate under load, DB connection saturation.

- Security Testing (recommended)
  - Tools: OWASP ZAP, Snyk, npm audit.
  - Targets: Authentication endpoints, payment endpoints, file/URL inputs.
  - Checks: SQL/NoSQL injection, auth bypass, insecure secrets, token expiry, signature verification (Razorpay flow).

## Test Environment

- Local test environment uses `mongodb-memory-server` (see `tests/setup.js`).
- Node: use project's Node version (see `backend/package.json`).
- Environment variables: `JWT_SECRET`, `RAZORPAY_KEY_SECRET`, etc. For tests these are read from `.env` or provided by CI.

## Test Data

- Seeds: `tests/seedData.js` creates users (organizer, attendee, admin, unverified user), events (future and past), bookings, reviews, paymentOrders.
- Sample data file: `backend/testing_docs/Sample_Test_Data.json` (generated from seeds).

## Coverage Matrix (mapping to files)

- Auth: `tests/auth.test.js` — register, login, OTP verification, profile updates, change password, logout, token checks.
- Events: `tests/events.test.js` — list/filter/sort, get event, create/update/delete, categories, organizer endpoints.
- Bookings: `tests/bookings.test.js` — create booking, listing, cancel, event bookings, pagination, auth checks.
- Payments: `tests/payments.test.js` — create-order, verify-payment, fees calculation, booking status update.
- Reviews: `tests/reviews.test.js` — create/retrieve/update/delete reviews, moderation, voting, reporting.
- Users: `tests/users.test.js` — profile endpoints, stats, avatar, deactivate, user events/bookings.
- Unit model: `tests/user.model.unit.test.js` — model validation and password hashing.

## Pass/Fail Criteria

- Unit tests: All assertions pass, >80% coverage for model logic.
- Integration tests: All endpoint tests pass with mocked/in-memory DB.
- Regression: No new failing tests; critical flows (auth -> booking -> payment) must pass in CI.

## Schedule & Responsibility

- Author: Testing lead / backend dev.
- Suggested timeline for this deliverable: 1 day to prepare docs, 1 day to run tests and collect reports, 1 day for remediation.

## Risks & Assumptions

- Tests assume environment variables (JWT secret, Razorpay keys) are available or can be mocked.
- Payment gateway interactions are simulated; do not hit real payment APIs during CI.

## Next Steps

- Generate Test Report from latest test run and attach logs (see `Test_Report.md`).
- Run recommended performance and security scans and append results to report.

## Recent Test Run Outcome (2025-11-17)

- We executed the full Jest suite locally using the in-memory MongoDB setup and produced a passing snapshot.
- Test run summary: 6 suites, 136 tests, 136 passed, 0 failed, duration ~117.5s.
- Coverage (Jest): Statements 70.62%, Branches 51.46%, Functions 79.76%, Lines 70.40%.

## Recommended immediate actions

- CI: Run `npm run test:ci` on PRs to fail builds on regressions and produce JUnit reports for pipelines.
- Performance: schedule a k6/Artillery smoke test for booking/payment at 100 RPS and capture p95/p99 latency.
- Security: run `npm audit --production` and an OWASP ZAP scan against a deployed staging instance; ensure secrets and keys are not logged.

## Commands to reproduce locally

```powershell
cd 'c:\sem 3\WebSerSOA\EventHub\backend'
# run full tests with coverage
npm test
# CI-style run with junit output
npm run test:ci
```

Record these runs and attach `backend/tests/reports/test-run-summary.*` to project artifacts.
