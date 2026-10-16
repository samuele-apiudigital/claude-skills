---
name: open-project
description: Open an existing project folder in VS Code and tile the VS Code windows (the opened project anchored left, the others arranged so every VS Code window stays visible). Use when the user asks to open a project, codebase or folder in VS Code, e.g. "open promozioni.ariston.com in vs code", "open the octagroup project", "apri il progetto club-morena". Not for creating a new worktree or branch; use open-worktree for that.
---

# Open a project

Run these steps in order and report the outcome at the end.

## 1. Resolve the project

- Projects live at `~/Projects/<client>/<project>`. Worktrees sit next to their repo as `<project>-<slug>`.
- Match the name the user gives against the folders two levels down:
  `find ~/Projects -mindepth 2 -maxdepth 2 -type d -iname '*<name>*'`
  - The user may name the client and project together ("ariston promozioni"). Match both parts against the path.
  - Prefer an exact folder name over a partial match.
  - If several folders still match, list them and ask which one. If none match, try `-maxdepth 3` and then ask.
- If they give a path, use it as-is. If they say "this project", use `git rev-parse --show-toplevel` from the current directory.
- The path must exist. Never create it.

## 2. Open in VS Code

`code "<path>"`

If the project is already open, VS Code focuses that window instead of opening a second one. Still tile in that case.

## 3. Tile the windows

`osascript -l JavaScript ~/.claude/skills/open-project/scripts/tile-vscode.js "<path-basename>"`

The script is shared with open-worktree. It:

- waits up to 30s for the window whose title contains the folder name;
- picks the display that holds most of the other VS Code windows. If VS Code opened the new window on a different display, it moves the window there;
- puts that window on the left half of the chosen display, with 8px gaps like native macOS tiling;
- puts the other VS Code windows on the same display in the right half. Up to 3 are stacked in rows; 4 or more go in a 2-column grid;
- restores minimized windows;
- skips full-screen windows;
- leaves windows on other displays alone, since they are already visible.

Pass `--dry-run` to print the planned layout without moving anything.

If the user asks to open several projects at once, run `code` for each, then tile once with the last one as the target.

If it fails with `not allowed assistive access`, tell the user to add their terminal app under **System Settings → Privacy & Security → Accessibility** and say "try again". Until then they can tile the window by hand with **Fn + Ctrl + ←**.

## 4. Report

Keep it short:

- the path that was opened;
- whether it was already open;
- how the windows were laid out.
