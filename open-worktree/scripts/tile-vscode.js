#!/usr/bin/osascript -l JavaScript
// Usage: osascript -l JavaScript tile-vscode.js <folder-name> [--dry-run]
// Puts the VS Code window whose title contains <folder-name> on the left half of the
// display holding most of the other VS Code windows (moving it there if needed) and
// stacks the other VS Code windows on that display in the right half.

ObjC.import('AppKit');

const GAP = 8;
const SEPARATOR = ' — ';

function run(argv) {
  const folder = argv.find(arg => !arg.startsWith('--'));
  const dryRun = argv.includes('--dry-run');
  if (!folder) {
    throw new Error('usage: tile-vscode.js <folder-name> [--dry-run]');
  }

  const systemEvents = Application('System Events');
  if (!waitForWindow(systemEvents, folder, 30)) {
    throw new Error(`No VS Code window titled with "${folder}" appeared within 30s`);
  }
  delay(1.5);

  for (let attempt = 1; ; attempt++) {
    try {
      return tile(systemEvents, folder, dryRun);
    } catch (e) {
      if (attempt >= 3) {
        throw e;
      }
      delay(1);
    }
  }
}

function tile(systemEvents, folder, dryRun) {
  const proc = systemEvents.processes.byName('Code');
  const byName = win => proc.windows.byName(win.name());
  const target = byName(proc.windows().find(win => isWindowFor(win, folder)));
  const screens = readScreens();

  const others = proc.windows()
    .filter(win => win.subrole() === 'AXStandardWindow' && !isWindowFor(win, folder) && !isFullScreen(win))
    .map(byName);
  if (!dryRun) {
    others.forEach(restore);
  }
  const display = homeDisplay(screenOf(target, screens), others.map(win => screenOf(win, screens)), screens);
  const peers = others
    .filter(win => screenOf(win, screens) === display)
    .sort((a, b) => a.position()[1] - b.position()[1] || a.position()[0] - b.position()[0]);

  const area = display.visible;
  const halfWidth = (area.w - 3 * GAP) / 2;
  const fullHeight = area.h - 2 * GAP;
  const plan = [{ win: target, x: area.x + GAP, y: area.y + GAP, w: halfWidth, h: fullHeight }];

  if (peers.length > 0) {
    const cols = peers.length <= 3 ? 1 : 2;
    const rows = Math.ceil(peers.length / cols);
    const cellWidth = (halfWidth - (cols - 1) * GAP) / cols;
    const cellHeight = (fullHeight - (rows - 1) * GAP) / rows;
    const rightX = area.x + 2 * GAP + halfWidth;
    peers.forEach((win, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      plan.push({
        win,
        x: rightX + col * (cellWidth + GAP),
        y: area.y + GAP + row * (cellHeight + GAP),
        w: cellWidth,
        h: cellHeight,
      });
    });
  }

  if (!dryRun) {
    plan.forEach(place);
  }

  return JSON.stringify(plan.map(p => ({
    window: p.win.name(),
    position: [Math.round(p.x), Math.round(p.y)],
    size: [Math.round(p.w), Math.round(p.h)],
  })), null, 2);
}

function waitForWindow(systemEvents, folder, seconds) {
  for (let i = 0; i < seconds * 2; i++) {
    const proc = systemEvents.processes.byName('Code');
    if (proc.exists()) {
      if (proc.windows().some(win => isWindowFor(win, folder))) {
        return true;
      }
    }
    delay(0.5);
  }
  return false;
}

function isWindowFor(win, folder) {
  return String(win.name() || '').split(SEPARATOR).includes(folder);
}

function isFullScreen(win) {
  try {
    return win.attributes.byName('AXFullScreen').value() === true;
  } catch (e) {
    return false;
  }
}

function restore(win) {
  try {
    if (win.attributes.byName('AXMinimized').value() === true) {
      win.attributes.byName('AXMinimized').value = false;
      delay(0.4);
    }
  } catch (e) {}
}

function place(p) {
  const position = [Math.round(p.x), Math.round(p.y)];
  p.win.position = position;
  p.win.size = [Math.round(p.w), Math.round(p.h)];
  p.win.position = position;
}

function readScreens() {
  const list = $.NSScreen.screens;
  const primaryHeight = list.objectAtIndex(0).frame.size.height;
  const toTopLeft = rect => ({
    x: rect.origin.x,
    y: primaryHeight - rect.origin.y - rect.size.height,
    w: rect.size.width,
    h: rect.size.height,
  });
  const screens = [];
  for (let i = 0; i < list.count; i++) {
    const screen = list.objectAtIndex(i);
    screens.push({ frame: toTopLeft(screen.frame), visible: toTopLeft(screen.visibleFrame) });
  }
  return screens;
}

function homeDisplay(current, otherDisplays, screens) {
  const counts = new Map();
  otherDisplays.forEach(s => counts.set(s, (counts.get(s) || 0) + 1));
  const most = Math.max(0, ...counts.values());
  if (most === 0 || counts.get(current) === most) {
    return current;
  }
  return screens.find(s => counts.get(s) === most);
}

function screenOf(win, screens) {
  const [x, y] = win.position();
  const [w, h] = win.size();
  const cx = x + w / 2;
  const cy = y + h / 2;
  const inside = screens.find(s =>
    cx >= s.frame.x && cx < s.frame.x + s.frame.w && cy >= s.frame.y && cy < s.frame.y + s.frame.h);
  if (inside) {
    return inside;
  }
  const distance = s => Math.hypot(cx - (s.frame.x + s.frame.w / 2), cy - (s.frame.y + s.frame.h / 2));
  return screens.reduce((best, s) => (distance(s) < distance(best) ? s : best));
}
