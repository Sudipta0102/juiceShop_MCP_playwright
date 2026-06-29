# OWASP Juice Shop + SQLite Database Exploration Setup

## Objective

Set up OWASP Juice Shop in Docker and access its SQLite database for:

* Manual database validation
* Database exploration
* Playwright + TypeScript database assertions

---

## Prerequisites

* Docker Desktop
* VS Code
* DB Browser for SQLite
* Node.js and npm (for Playwright later)

---

## Docker Compose Configuration

Create `docker-compose.yml`:

```yaml
services:
  juiceshop:
    image: bkimminich/juice-shop:latest
    container_name: juiceshop
    ports:
      - "8888:3000"
    restart: unless-stopped
```

Start the application:

```bash
docker compose up -d
```

Verify startup:

```bash
docker logs -f juiceshop
```

Expected log:

```text
info: Server listening on port 3000
```

Access the application:

```text
http://localhost:8888
```

---

## Why Volume Mounting Was Removed

Initial attempt:

```yaml
volumes:
  - ./docker-data:/juice-shop/data
```

This caused application startup failures because Juice Shop expects configuration files under:

```text
/juice-shop/data/static
```

Mounting an empty host folder replaced the container's internal data directory and removed required files.

Error example:

```text
Could not open file:
/juice-shop/data/static/securityQuestions.yml
```

Therefore the volume mapping was removed.

---

## Extracting the SQLite Database

Copy the internal data directory from the running container:

```bash
docker cp juiceshop:/juice-shop/data ./container-data
```

Result:

```text
container-data/
├── juiceshop.sqlite
├── users.yml
├── challenges.yml
├── securityQuestions.yml
└── ...
```

The SQLite database file is:

```text
container-data/juiceshop.sqlite
```

---

## Opening the Database

Open DB Browser for SQLite.

Select:

```text
container-data/juiceshop.sqlite
```

Browse tables under:

```text
Tables
```

Examples:

```text
Users
Products
Baskets
BasketItems
Addresses
Cards
Challenges
SecurityQuestions
SecurityAnswers
```

---

## Manual Database Validation Example

### UI Action

Register a user:

```text
qa1@test.com
```

### Database Validation

Execute:

```sql
SELECT *
FROM Users
WHERE email = 'qa1@test.com';
```

Expected:

```text
1 user record returned
```

---

## Planned Automation Architecture

```text
Playwright Tests
        │
        ▼
OWASP Juice Shop UI
        │
        ▼
SQLite Database
        │
        ▼
DB Assertions
```

Example validations:

* User registration creates User record
* Basket creation creates Basket record
* Add-to-cart creates BasketItem record
* Product review creates Feedback record
* Order creation updates related tables

---

## Useful Tables

| Table             | Purpose                       |
| ----------------- | ----------------------------- |
| Users             | Registered users              |
| Products          | Product catalog               |
| Baskets           | User baskets                  |
| BasketItems       | Basket contents               |
| Addresses         | User addresses                |
| Cards             | Payment cards                 |
| SecurityQuestions | Account recovery questions    |
| SecurityAnswers   | User answers                  |
| Challenges        | Juice Shop challenge tracking |

---

## Next Steps

1. Explore database schema.
2. Create manual database test cases.
3. Create Playwright + TypeScript project.
4. Add SQLite helper layer.
5. Implement UI + DB validation tests.

```
```