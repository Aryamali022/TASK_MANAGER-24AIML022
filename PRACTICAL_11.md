# Practical 11 – CI Pipeline with GitHub Actions

## Aim
Set up a GitHub Actions workflow that runs on every push to `main`, installs the
backend's dependencies and runs automated tests, with a clear pass/fail result.
Then show a failed run caused by a deliberately broken test, and a passing run
after the test is fixed.

## Pipeline

```
git push origin main
   |
   v
GitHub Actions starts job "build-and-test" on a fresh ubuntu-latest VM
   |
   ├── 1. Check out code          (actions/checkout@v4)
   ├── 2. Set up Node.js 22       (actions/setup-node@v4, npm cache)
   ├── 3. Install dependencies    (npm install, in backend/)
   └── 4. Run tests               (npm test -> jest --verbose)
            |
            ├── all tests pass  ──► exit code 0 ──► green tick ✔
            └── any test fails  ──► exit code 1 ──► red cross ✘ (job stops here)
```

## Files

| File | What it does |
|------|--------------|
| `.github/workflows/ci.yml` | The workflow: trigger, job, and the four steps above |
| `backend/tests/tasks.test.js` | Jest + supertest tests for `GET /tasks` and `POST /tasks` |
| `backend/server.js` | Now exports `app`; connects to MongoDB and listens only when run with `node server.js` |
| `backend/package.json` | `"test": "jest --verbose"`, `jest` and `supertest` in `devDependencies` |
| `.gitignore` | Keeps `node_modules/` and `.env` (real secrets) out of the repository |

## Main code

```yaml
# .github/workflows/ci.yml
name: CI Pipeline
on:
  push:
    branches: [main]
  workflow_dispatch:
jobs:
  build-and-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - name: Check out code
        uses: actions/checkout@v4
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
```

```js
// backend/tests/tasks.test.js (main test)
test('returns 200 and the user\'s tasks with a valid token', async () => {
  const find = jest.spyOn(Task, 'find').mockReturnValue({
    lean: () => Promise.resolve(sampleTasks),
  });

  const res = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${token}`);

  expect(res.statusCode).toBe(200);
  expect(res.body).toHaveLength(2);
  expect(find).toHaveBeenCalledWith({ user: user.id });
});
```

The three tests:

| Test | Checks |
|------|--------|
| `GET /tasks` without a token | 401, `No token provided` (auth middleware) |
| `GET /tasks` with a valid JWT | 200, the user's 2 tasks, and `Task.find` filtered by that user |
| `POST /tasks` without a title | 400, `title is required`, and nothing written to the database |

### Change from the lab sheet: `server.js` exports the app
supertest needs the Express `app` object. `server.js` used to call
`mongoose.connect()` and `app.listen()` as soon as it was loaded, so requiring it
from a test would try to reach MongoDB and hold port 5000 open. Both now sit inside
`if (require.main === module)`, which is true only for `node server.js`, and the
file ends with `module.exports = app`. `npm start` works exactly as before.

### Change from the lab sheet: `GET /tasks` needs a token and a database
The sheet's one-line test would get **401**, not 200, because every task route is
behind the JWT `auth` middleware. And the CI VM has no MongoDB. So the test:
- signs a real JWT with a test secret (`JWT_SECRET=ci-test-secret`, set in the
  test file, so no secrets are needed in GitHub), and
- mocks `Task.find(...).lean()` with `jest.spyOn`, so the route gets a task list
  without a database.

This tests the Express part (routing, auth, validation, status codes), which is
what can run in CI without extra services.

### Change from the lab sheet: Node 22 instead of 18
`mongoose@9` needs Node ≥ 20.19 and `nodemailer@10` needs Node ≥ 20, so the
backend does not install cleanly on Node 18 (which is also end-of-life). The
workflow uses Node 22, the current LTS.

### Other workflow details
- `working-directory: backend`: the repository root has no `package.json`; the
  Node project is in `backend/`.
- `cache: npm`: keeps the npm download cache between runs, keyed on
  `package-lock.json`, so installs are faster.
- `workflow_dispatch`: adds a "Run workflow" button in the Actions tab for re-runs
  without a new commit.
- `backend/package.json` and `package-lock.json` were not in the repository before
  this practical. Without them `npm install` in CI has nothing to install, so they
  are committed now.

## Pipeline runs (verified)

| # | Commit | What changed | Result | Run |
|---|--------|--------------|--------|-----|
| 1 | `9bfa43a` | Workflow + 3 tests added | ✔ success | [run 40334158762](https://github.com/Aryamali022/TASK_MANAGER-24AIML022/actions/runs/40334158762) |
| 2 | `4a0e12b` | Test broken on purpose: `toBe(200)` → `toBe(201)` | ✘ failure | [run 40334307978](https://github.com/Aryamali022/TASK_MANAGER-24AIML022/actions/runs/40334307978) |
| 3 | this commit | Test fixed back to `toBe(200)`, this write-up added | ✔ success | see the Actions tab |

Steps of the failed run (#2), from the GitHub API:

```
build-and-test            failure
  Check out code          success
  Set up Node.js          success
  Install dependencies    success
  Run tests               failure   <-- the job went red here
```

What the `Run tests` log shows for the broken test (same output as locally):

```
GET /tasks
  ✓ returns 401 when no token is sent
  ✕ returns 200 and the user's tasks with a valid token

  ● GET /tasks › returns 200 and the user's tasks with a valid token

    expect(received).toBe(expected) // Object.is equality

    Expected: 201
    Received: 200

Tests:       1 failed, 2 passed, 3 total
Error: Process completed with exit code 1.
```

**Reading the log:** the API was right (it returned 200); the *test* was wrong.
The `●` block names the failing test, the expected and received values, and the
line of the test file. Jest exits with code 1, and any non-zero exit code makes
GitHub mark the step, the job and the commit as failed.

### Screenshots for the journal (fill in)
| Screenshot | Where to take it |
|------------|------------------|
| Failed run (red ✘) | Actions tab → run #2 → open `build-and-test` → expand `Run tests` |
| Passed run (green ✔) | Actions tab → run #3 → open `build-and-test` → expand `Run tests` |

## Key questions

**1. What is the difference between Continuous Integration and Continuous
Deployment, and which one does this practical demonstrate?**
- **Continuous Integration (CI):** every change pushed to the shared branch is
  built and tested automatically, so broken code is found within minutes of the
  push.
- **Continuous Delivery:** after CI passes, the build is packaged so that it is
  always ready to release; a person presses the button to deploy.
- **Continuous Deployment:** after CI passes, the change goes to production
  automatically, with no manual step.

This practical demonstrates **CI only**. The pipeline installs and tests, then
stops. Nothing is built into an image, pushed to a registry or deployed. Adding
a job that runs after `build-and-test` succeeds and, for example, builds the
Docker images from Practical 9 and deploys them would turn it into continuous
delivery or deployment.

**2. Why does running tests automatically on every push catch problems earlier
than testing manually before a release?**
- **Small changes.** A failing run points at one push with a few changed lines.
  Testing only before a release means searching weeks of commits for the cause.
- **Nobody can forget.** The tests run on every push, even when someone is in a
  hurry or sure their change is harmless.
- **A clean machine.** The VM starts empty each time, so "works on my machine"
  problems show up: a missing dependency in `package.json`, a file not committed,
  a Node version mismatch. (This practical found one: `package.json` had never been
  committed.)
- **Instant, visible feedback.** The red cross appears on the commit within about a
  minute, before other work is built on top of the bug.

**3. If the test file path were wrong, would the workflow fail at the same step as
a genuine test failure?**
It fails at the **same step** (`Run tests`) with the **same exit code** (1), so
the red cross on GitHub looks the same. The log tells them apart:

| | Genuine test failure | Wrong test path |
|---|---|---|
| Step that fails | `Run tests` | `Run tests` |
| Exit code | 1 | 1 |
| Log shows | `✕` test name, `Expected: 201 / Received: 200`, `Tests: 1 failed` | `No tests found, exiting with code 1` and `Pattern: tests/wrong-path.test.js - 0 matches` |
| Meaning | The code (or the test) is wrong | The pipeline is misconfigured; no code was tested at all |

Checked locally with `npx jest tests/wrong-path.test.js`. Jest fails on "no tests
found" by default. With `--passWithNoTests` it would exit 0 and the pipeline would
go **green while testing nothing**, which is why that flag should not be used in
CI. A wrong path elsewhere fails at a different step: a misspelt
`working-directory` (e.g. `backed`) makes `Install dependencies` fail because the
folder does not exist, and `Run tests` is then skipped.
