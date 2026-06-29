# OWASP Juice Shop Automation Showcase

A **TypeScript + Playwright** automation framework built against **OWASP Juice Shop**, designed to showcase production-oriented automation architecture rather than application test coverage.

The project demonstrates how to build a scalable automation framework by combining modern Playwright capabilities with clean abstractions such as Page Objects, composable fixtures, API utilities, network interception, and SQLite-backed database validation.

---

## Highlights

* TypeScript + Playwright
* Page Object Model (POM)
* Composable Playwright Fixtures
* API + UI Hybrid Testing
* Network Interception Utilities
* SQLite Database Validation
* Docker Managed Test Environment
* Automatic Application Setup & Teardown
* HTML Reporting
* Cross Browser Execution

---

# Project Structure

```text
.
├── docs/
│   ├── DBValidationApproach.md
│   ├── PageObjectLocatorStrategy.md
│   └── appSetup.md
│
├── infra/
├── src/
├── tests/
├── playwright.config.ts
└── package.json
```

---

# Tech Stack

* Playwright
* TypeScript
* Node.js
* Docker
* SQLite
* better-sqlite3

---

# Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd <repository>
```

### 2. Install dependencies

```bash
npm install
```

### 3. Ensure Docker Desktop is running

The framework automatically starts OWASP Juice Shop before test execution and shuts it down when testing completes.

### 4. Execute the tests

```bash
npm test
```

Additional commands

```bash
npm run test:headed
npm run test:ui
```

---

# Framework Overview

### Page Object Model

Business interactions are encapsulated inside dedicated Page Objects, keeping tests readable and independent of UI implementation details.

Current implementation includes:

* Header
* Registration Page
* Login Page
* Product List Page
* Basket Page

---

### Fixture-Based Architecture

The framework uses Playwright fixtures to compose reusable capabilities instead of embedding setup logic directly into tests.

Current fixtures include:

* Database Fixture
* Network Fixture

This design keeps tests focused on business intent while promoting reuse and scalability.

---

### Database Validation

The framework validates application state by creating SQLite database snapshots from the running Juice Shop Docker container.

Instead of querying the live database, every validation operates against an isolated snapshot, making database assertions deterministic and repeatable.

📖 **Read more**

* [DB validation approach](docs/DBValidationApproach.md)

---

### Network Utilities

The framework provides reusable abstractions over Playwright's routing APIs.

Current capabilities include:

* Mock API Responses
* Modify Request Payloads
* Modify Live Responses
* Abort Requests
* Replace Routes
* Automatic Route Cleanup

---

### API Utilities

A lightweight session-aware API client enables hybrid API + UI testing.

Supported operations include:

* GET
* POST
* PUT
* DELETE

---

### Application Lifecycle

Application startup and shutdown are handled automatically using Playwright Global Setup and Global Teardown.

This removes the need for manual environment preparation before executing tests.

📖 **Read more**

* [Set Up the Application](docs/appSetup.md)

---

# Current Test Suites

* Smoke Tests
* End-to-End Tests
* Database Validation Tests

---

# Reports

Playwright HTML Reports are generated automatically after execution.

---

# Current Focus

This repository is intentionally framework-oriented.

Its objective is to demonstrate clean automation architecture, reusable abstractions, and scalable framework design rather than exhaustive application coverage.

---

# Planned Enhancements

* API Authentication Fixture
* Visual Regression Testing
* Accessibility Testing
* Environment Profiles
* Test Data Builders
* CI/CD Enhancements
* Parallel Execution Improvements
* Expanded API Coverage
* Additional Page Objects
* Performance Testing

---

# Documentation

Detailed design decisions are available under the **docs/** directory.

| Document                            | Description                                                                                              |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `docs/appSetup.md`                  | Docker lifecycle, Playwright global setup/teardown, and application startup flow                         |
| `docs/PageObjectLocatorStrategy.md` | Page Object design philosophy, locator selection strategy, and maintainability considerations            |
| `docs/DBValidationApproach.md`      | SQLite snapshot workflow, database verification strategy, and rationale behind snapshot-based assertions |

---

# License

This repository is intended as a learning resource and portfolio showcase demonstrating modern Playwright automation framework architecture.
