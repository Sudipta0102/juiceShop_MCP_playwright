## Database Validation Approach

OWASP Juice Shop uses an internal SQLite database (`juiceshop.sqlite`) inside the Docker container.

Since the database file is not directly exposed to the host machine, database validation is performed using the following workflow:

1. Execute a UI action (e.g., register a user, add an item to the basket).
2. Remove the previous database snapshot to avoid querying stale data:

```bash
rm -rf container-data
```

Windows PowerShell:

```powershell
rmdir /s /q container-data
```

3. Copy the latest database snapshot from the running container:

```bash
docker cp juiceshop:/juice-shop/data ./container-data
```

4. Open `container-data/juiceshop.sqlite` using DB Browser for SQLite or query it through Playwright.
5. Execute SQL queries to verify that the UI action was persisted correctly.

Example:

```sql
SELECT *
FROM Users
WHERE email = 'test@example.com';
```

### Playwright Flow

```text
UI Action
    ↓
Delete Previous Snapshot
    ↓
Refresh Database Snapshot
    ↓
Query SQLite Database
    ↓
Validate Database State
```

Deleting the previous snapshot before copying is recommended to ensure all database validations are performed against the latest state of the application database and to avoid accidentally querying outdated data.

### Database Reset Strategy

The `container-data` directory contains a snapshot of the SQLite database copied from the running Juice Shop container.

Because this snapshot does not automatically update, it can become stale as new users and data are created.

To obtain a clean database state:

1. Recreate the Juice Shop container:

```bash
docker compose down
docker compose up -d
```

2. Delete the existing snapshot:

```bash
rm -rf container-data
```

Windows PowerShell:

```powershell
rmdir /s /q container-data
```

3. Copy a fresh database snapshot:

```bash
docker cp juiceshop:/juice-shop/data ./container-data
```

After recreating the container and refreshing the snapshot, the database returns to its original seed state (23 users).

## Parallel Execution and Worker-Specific Database Snapshots

### Problem

The database validation tests use a local snapshot of the Juice Shop SQLite database:

```text
container-data/
└── juiceshop.sqlite
```

Originally all Playwright workers shared the same snapshot directory.

During parallel execution, multiple workers could simultaneously:

1. Delete the snapshot directory
2. Copy a fresh database snapshot from the Docker container
3. Open SQLite connections against the snapshot

Example race condition:

```text
Worker 0
  ├─ refreshDB()
  ├─ delete ./container-data
  └─ copy database

Worker 1
  ├─ refreshDB()
  ├─ open SQLite connection
  └─ read ./container-data
```

This caused intermittent failures that only appeared during parallel test execution.

### Symptoms

* Tests passed consistently when executed individually.
* Tests passed consistently with:

```bash
npx playwright test --workers=1
```

* Tests became flaky during parallel execution.
* Failures occurred randomly across Chromium and Firefox.
* Database-related failures were non-deterministic.

### Solution

Each Playwright worker now uses its own database snapshot directory.

Example:

```text
container-data/
├── worker-0/
│   └── juiceshop.sqlite
├── worker-1/
│   └── juiceshop.sqlite
├── worker-2/
│   └── juiceshop.sqlite
└── worker-3/
    └── juiceshop.sqlite
```

This eliminates file-system contention between workers.

### Worker Identification

Playwright provides a unique worker identifier through:

```ts
testInfo.workerIndex
```

Example:

```ts
const db = DatabaseManager.getFreshDatabase(
  testInfo.workerIndex
);
```

### DatabaseManager

`DatabaseManager` now receives the worker id and generates a worker-specific snapshot path:

```ts
DatabaseManager.getFreshDatabase(
  workerId
);
```

Example snapshot path:

```text
container-data/worker-1
```

### Benefits

* Parallel-safe database validation
* No snapshot deletion conflicts
* No SQLite file contention between workers
* Faster execution compared to running the entire suite serially

### Design Decision

Worker-specific snapshot isolation was chosen over serial execution because it preserves Playwright parallelism while maintaining deterministic database assertions.
