---
name: open-worktree
description: Open a new git worktree for a codebase with lerd, open it in VS Code, and tile the VS Code windows (new window anchored left, the others arranged so every VS Code window stays visible). Use when the user asks to open/create a new worktree or working tree, e.g. "open a new working tree from dev with a branch feat/x", "new worktree for <codebase> on branch y".
---

# Open a worktree

Run these steps in order and report the outcome at the end.

## 1. Resolve the inputs

- **Repo**: the codebase the user names (look under `~/Projects` and confirm if more than one matches). If they name none, use `git rev-parse --show-toplevel` from the current directory.
- **Base**: the branch to start from ("from dev").
- **Branch**: the branch to work on ("with a branch feat/x").
- If they give only one branch: when it already exists locally or on `origin`, check it out as-is. When it doesn't exist, ask which base to branch from.

## 2. Pick the path and check for conflicts

- Path: a sibling of the repo, `<repo-parent>/<repo-dir>-<slug>`. To get the slug, drop the branch's first segment when it is a type prefix (`feat/`, `fix/`, `hotfix/`, `chore/`, `refactor/`, `docs/`, `test/`), then replace the remaining `/` with `-`.
  - Example: `feat/update-export-layout` in `~/Projects/ariston/promozioni.ariston.com` gives `~/Projects/ariston/promozioni.ariston.com-update-export-layout`.
- Stop and tell the user if:
  - the path already exists, or
  - `git worktree list` shows the branch already checked out somewhere.

## 3. Create it with lerd

Fetch first, with `git -C <repo> fetch origin <base-or-branch>`. Then run from the repo root with a 10-minute timeout. `</dev/null` makes lerd's prompts take their defaults: it builds assets automatically and picks share/clone for the database from the migration diff.

- New branch from a base:
  `lerd worktree add --no-track -b <branch> <path> origin/<base> </dev/null`
  `--no-track` keeps the new branch from tracking `<base>`, so a bare `git pull` or `git push` can't hit the base branch.
- Existing branch:
  `lerd worktree add <path> <branch> </dev/null`

Read the output:

- From the `Database:` line, note whether the worktree shares the main database or has its own.
- From the `✓ worktree ready:` line, take the URL.

If the output has no `✓ worktree ready:` line, the setup did not finish. Show the error and stop.

Always use `lerd worktree add`, never plain `git worktree add`. lerd installs dependencies, builds assets, sets up the database and gives the worktree a `<branch>.<site>.test` domain.

## 4. Open in VS Code

`code <path>`

## 5. Tile the windows

`osascript -l JavaScript ~/.claude/skills/open-worktree/scripts/tile-vscode.js <path-basename>`

The script:

- waits up to 30s for the window whose title contains the folder name;
- picks the display that holds most of the other VS Code windows. If VS Code opened the new window on a different display, it moves the window there;
- puts that window on the left half of the chosen display, with 8px gaps like native macOS tiling;
- puts the other VS Code windows on the same display in the right half. Up to 3 are stacked in rows; 4 or more go in a 2-column grid;
- restores minimized windows;
- skips full-screen windows;
- leaves windows on other displays alone, since they are already visible.

Pass `--dry-run` to print the planned layout without moving anything.

If it fails with `not allowed assistive access`, tell the user to add their terminal app under **System Settings → Privacy & Security → Accessibility** and say "try again". Until then they can tile the window by hand with **Fn + Ctrl + ←**.

## 6. Report

Keep it short:

- the path;
- the branch and its base;
- the URL;
- whether the database is shared or isolated;
- how the windows were laid out.
