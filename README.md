# claude-skills

Personal [Claude Code](https://claude.com/claude-code) skills for macOS.

| Skill | What it does |
| --- | --- |
| [`open-worktree`](open-worktree/SKILL.md) | Creates a git worktree with lerd, opens it in VS Code and tiles the VS Code windows. |
| [`open-project`](open-project/SKILL.md) | Opens an existing project in VS Code and tiles the VS Code windows. |

Both skills tile windows with [`tile-vscode.js`](open-worktree/scripts/tile-vscode.js). `open-project` links to the same file with a symlink. The script:

- puts the opened window on the left half of the display that holds most of the other VS Code windows, moving it there if needed;
- arranges the other VS Code windows on that display in the right half.

## Install

```sh
git clone https://github.com/samuele-apiudigital/claude-skills.git
ln -s "$PWD/claude-skills/open-worktree" ~/.claude/skills/open-worktree
ln -s "$PWD/claude-skills/open-project" ~/.claude/skills/open-project
```

Your terminal app needs Accessibility access to move windows: **System Settings → Privacy & Security → Accessibility**.
