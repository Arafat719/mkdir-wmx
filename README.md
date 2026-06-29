# wmx — WebMarketX Developer OS

A developer CLI that handles the boring parts of web projects: scaffolding, health checks, dependency audits, deployment config, environment management, and more.

Run `wmx` with no arguments to open an interactive TUI dashboard. Pass a subcommand to run it directly.

---

## Installation

```bash
npm install -g wmx-os
```

**Requirements:** Node.js ≥ 18, Git

---

## Commands

### `wmx init`
Scaffold a new project with an interactive wizard.

Prompts for language, framework, backend, database, auth, and package manager, then generates a ready-to-run project.

```bash
wmx init
```

**Supported stacks:**
- Languages: TypeScript, JavaScript
- Frameworks: React, Next.js, Vue
- Backends: Express, NestJS, None
- Databases: MongoDB, PostgreSQL, MySQL, None
- Auth: JWT, None
- Package managers: npm, pnpm, bun

Built-in templates: `nextjs-postgres`, `react-express-mongo`

---

### `wmx doctor`
Scan the project for errors, warnings, and health issues.

```bash
wmx doctor
wmx doctor --fix   # attempt auto-fix
wmx doctor --json  # output as JSON
```

Prints a health score (0–100) with categorized errors, warnings, and info items.

---

### `wmx check`
Verify that required and optional tools are installed in your local environment.

```bash
wmx check
wmx check --json
```

Checks: Node.js (≥ 18 required), Git (required), npm, pnpm, bun, Docker, mongosh. Also validates `.env` against `.env.example`.

---

### `wmx analyze`
Analyze project architecture and write a report to `.wmx/analysis.md` and `.wmx/analysis.json`.

```bash
wmx analyze
wmx analyze --output reports   # custom output dir
wmx analyze --no-routes        # skip route detection
wmx analyze --no-imports       # skip import graph
```

Reports: folder tree, API routes, top imports, exported symbols.

---

### `wmx stats`
Print detailed statistics about the current project.

```bash
wmx stats
wmx stats --json
```

Reports: source files, lines of code, components, pages, API routes, dependencies, assets, largest file, file type breakdown.

---

### `wmx deps`
Audit project dependencies.

```bash
wmx deps              # show all categories
wmx deps --unused     # unused dependencies
wmx deps --heavy      # heavy deps with lighter alternatives
wmx deps --outdated   # outdated versions
wmx deps --json       # output as JSON
```

---

### `wmx upgrade`
Interactively select and upgrade outdated dependencies.

```bash
wmx upgrade
wmx upgrade --dry-run  # preview without making changes
```

---

### `wmx deploy`
Generate a deployment config file for your chosen provider.

```bash
wmx deploy
wmx deploy --provider vercel
wmx deploy --provider render
wmx deploy --provider netlify
wmx deploy --output ./path   # write to a specific directory
```

Generates `vercel.json`, `render.yaml`, or `netlify.toml`.

---

### `wmx env`
Manage environment variables across `.env` and `.env.example`.

```bash
wmx env list                      # list all keys with masked values
wmx env add DATABASE_URL postgres  # add/update a key
wmx env remove DATABASE_URL        # remove a key (with confirmation)
wmx env sync                       # compare .env and .env.example
```

---

### `wmx snapshot`
Save and restore project state snapshots (dependencies, stats, git commit).

```bash
wmx snapshot save            # save with auto-generated name
wmx snapshot save my-backup  # save with a custom name
wmx snapshot list            # list all snapshots
wmx snapshot restore my-backup
```

Snapshots are stored in `.wmx/snapshots/`.

---

### `wmx info`
Print a summary of the current project.

```bash
wmx info
wmx info --json
```

Shows: project name/version, detected framework/backend/database, package manager, Node.js version, git branch, last commit.

---

### `wmx tree`
Print a visual directory tree (ignores `node_modules`, `dist`, `.git`, etc.).

```bash
wmx tree
wmx tree --depth 5
wmx tree --json
```

---

### `wmx docs`
Generate documentation for the project.

```bash
wmx docs
```

---

## Monorepo Structure

```
wmx/
├── packages/
│   ├── cli/          # wmx-os — the CLI binary
│   ├── core/         # wmx-os-core — config, context, logger, plugin
│   ├── generators/   # wmx-os-generators — scaffolding and deploy config
│   └── scanners/     # wmx-os-scanners — AST, env, dependency, stats scanners
└── scripts/
    └── publish.mjs   # publish all packages
```

Built with [Turborepo](https://turbo.build) and pnpm workspaces.

---

## Development

```bash
pnpm install
pnpm build        # build all packages
pnpm dev          # watch mode
node wmx/packages/cli/dist/index.js <command>
```
