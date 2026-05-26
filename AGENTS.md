# Agent Instructions

Read `agent.md` before making project changes. It maps Jeonggan terminology to the current data model and calls out invariants around `Chapter.config.measure`, `Chapter.config.rhythm`, ordinary `Cell` data, and `rhythmMode`.

## Project

This repository is a Vue 3 / Vite / TypeScript app for writing, editing, and playing Jeongganbo. Keep changes consistent with the existing domain split:

- `src/domain/score/`: score model
- `src/domain/navigation/`: cursor, selection, coordinate lookup
- `src/domain/editing/`: undoable editing operations
- `src/domain/playback/`: playback and MIDI conversion
- `src/domain/serialization/`: YAML serialization
- `src/features/` and `src/app/`: browser-facing feature/session behavior
- `src/components/`: Vue UI

## Commands

- Install dependencies: `npm install`
- Run dev server: `npm run dev`
- Build: `npm run build`
- Run tests: `npm test`
- Run coverage: `npm run coverage`
- Format source: `npm run format`

## Happy Coder With Codex

Happy is installed globally as the `happy` CLI. Start a Codex session for this repo from the repository root with:

```sh
happy codex
```

First-time setup on this machine still requires user authentication:

```sh
happy auth login
happy connect codex
happy doctor
```

Happy stores machine credentials and logs under `~/.happy`. Use `happy doctor` when diagnosing connection, daemon, or authentication issues. Avoid `happy codex --no-sandbox` unless the user explicitly asks for unrestricted execution.
