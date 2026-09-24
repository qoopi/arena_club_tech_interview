# arena_club_tech_interview

End-to-end tests for Automation Exercise, the demo shop at https://www.automationexercise.com, written in Playwright and TypeScript. Tests describe what a user does and sees, one criterion per test, through page objects that hold every locator. The project is driven by the `agent-tests-playbook` plugin: a Claude Code session in this folder is the master session, `CLAUDE.md` is its charter, and the doors below add, fix and explore tests with you at the gates.

## Tech stack

| Tool                                                       | Role                                                                      |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- |
| Playwright 1.63                                            | test runner, browsers, tracing, reports                                   |
| TypeScript 6, strict                                       | page objects, fixtures, data, specs                                       |
| Bun                                                        | package manager and script runner; tests run under Node                   |
| ESLint with typescript-eslint and eslint-plugin-playwright | type-aware lint; raw locators warn, waits and skips error                 |
| Prettier                                                   | formatting, checked in the gate                                           |
| dotenv                                                     | `.env` into `playwright.config.ts`, the only place that reads it          |
| GitHub Actions                                             | `pr.yml` on pull requests, `nightly.yml` on schedule and release branches |
| Playwright test MCP server                                 | the browser the agents explore and debug with, started from `.mcp.json`   |
| agent-tests-playbook                                       | doors, agents and rules for the session                                   |

Browsers: chromium. Test id attribute: `data-qa`.

## Folder structure

```
.claude/settings.json      permissions for the session; .claude/work/<task>/ holds a task's briefs and handoffs, gitignored
.github/workflows/         pr.yml, nightly.yml, run-tests.yml
src/pages/                 one class per page: locator fields, action methods, expectLoaded()
src/components/            parts shared by pages, one class each
src/fixtures/test.ts       the only import for specs: page fixtures, hermetic mode
src/helpers/               pure functions
src/data/                  typed data: users by role, the words tests type and expect
tests/smoke/               the site answers
tests/<area>/              one folder per area tag, one spec per flow
tests/seed.spec.ts         where the agents' browser starts: the home page
playwright.config.ts       environments, tags, login, browsers, runner: every timeout and reporter lives here
.env.example               the variable names; .env holds the values and is never committed
.playwright/               every output: report, traces, results
```

## How to

**Set up.** `bun install`, then copy `.env.example` to `.env` and fill it: `TEST_ENV` and one `BASE_URL_<NAME>` per environment. Values never enter the repo.

**Run tests.**

| Want                           | Type                                                           |
| ------------------------------ | -------------------------------------------------------------- |
| typecheck, lint and formatting | `bun run check`                                                |
| the current environment's tags | `bun run test`                                                 |
| every level tag                | `bun run test:all`                                             |
| one level                      | `bun run test:smoke`, `bun run test:regression`                |
| one area                       | no grouping tags yet                                           |
| one spec or one test           | `bun run test:all tests/<area>/<spec>.ts -g "<test title>"`    |
| watch it                       | `bun run test:headed`, `bun run test:ui`, `bun run test:debug` |
| the last report                | `bun run report`                                               |

Any script takes Playwright flags after it. The scripts set `TAGS`; a `--grep` on the command line is combined with the environment's tags, so use the scripts to choose tags.

**Add, fix, explore.** Start Claude Code here with the plugin, `claude --plugin-dir <path to agent-tests-playbook>`, then type a door:

| Door                       | Type it when                   | You decide                           |
| -------------------------- | ------------------------------ | ------------------------------------ |
| `/add-tests <task>`        | a task needs tests             | after the plan, and on the done card |
| `/fix-tests [run or spec]` | a run is red, locally or on CI | on the done card                     |
| `/explore-product [area]`  | coverage is unknown            | on the done card                     |

**Ship.** Say the tests are reviewed and ask to commit, push or ship; the session follows the Ship steps of `CLAUDE.md`: gates, `features/<name>` branch, commit with plan ids, pull request into `releases/<name>` with the evidence table, CI watched.

**Environments and accounts.**

| environment | URL variable     | production | writes |
| ----------- | ---------------- | ---------- | ------ |
| pr          | BASE_URL_PR      | no         | yes    |
| staging     | BASE_URL_STAGING | no         | yes    |
| prod        | BASE_URL_PROD    | yes        | no     |

All three are https://www.automationexercise.com; the name decides the tags and the write policy.

Accounts: none; login is out of scope.

## Git and CI

- Flow: `main` → `features/<name>` → `releases/<name>` → `main`; `main` and `releases/*` are long-lived. `features/*` squash into `releases/*`; `releases/*` merge into `main` with a merge commit.
- Protected: `main` and `releases/**`: pull request required, `check` and `smoke / tests` checks required, no force push, no deletion.
- `pr.yml` on pull requests: a `check` job and a `smoke` job on the pull request environment. `nightly.yml` on schedule and on a push to `releases/*`: `smoke`, `regression` and `quarantine` jobs on staging. Every test job runs through `run-tests.yml`: a per-test report in the job summary, the HTML report as an artifact, traces when it failed.
