# Lock Tab for Zen Browser

A tiny [fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig) userscript for [Zen Browser](https://zen-browser.app/) that adds a **Lock Tab** option to the tab right-click menu. Locked tabs can't be closed or dragged out of place — accidentally.

![license](https://img.shields.io/badge/license-MIT-blue) ![zen-browser](https://img.shields.io/badge/Zen%20Browser-mod-9d6bff)

## Features

- **Right-click → Lock Tab / Unlock Tab** — toggle per tab, no settings page needed
- **Blocks closing** — the close (×) button, `Ctrl+W`, middle-click, and bulk actions like "Close Other Tabs" all no-op on a locked tab
- **Blocks dragging** — locked tabs can't be reordered in the tab strip or torn off into a new window
- **Visual indicator** — a small 🔒 badge on the tab's favicon so you can see what's locked at a glance
- Works on both Essential tabs and normal tabs

## Why

Zen doesn't ship a general-purpose tab lock, and it's easy to fat-finger a close or drag on a tab you meant to keep pinned in place. This fixes that with one script and no extra UI to configure.

## Requirements

- [Zen Browser](https://zen-browser.app/)
- [fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig) — the loader that lets custom JavaScript run in the browser chrome. Zen's official Mods marketplace only supports CSS, so this is required for any functional (non-visual) mod like this one.

> **A note on safety:** fx-autoconfig runs scripts with full browser-chrome privileges. Only install scripts from sources you trust, and read what a script does before dropping it into your profile — this one included.

## Installation

### 1. Install fx-autoconfig

If you haven't already, follow the [fx-autoconfig install instructions](https://github.com/MrOtherGuy/fx-autoconfig#install):

1. Download the [fx-autoconfig repo](https://github.com/MrOtherGuy/fx-autoconfig) as a ZIP and unzip it.
2. Copy `config.js` and the `defaults` folder from its `program` folder into your Zen install directory (next to the `zen` executable).
3. Open `about:support` in Zen → **Open Profile Folder**, then copy the *contents* of fx-autoconfig's `profile` folder into that profile folder. You should end up with a `chrome` folder containing `JS`, `resources`, and `utils`.

### 2. Add this script

Drop [`lockTab.uc.js`](./lockTab.uc.js) into `chrome/JS/` inside your Zen profile folder.

### 3. Clear the startup cache

In Zen, go to `about:support` and click **Clear Startup Cache…**. Zen will restart and the script will be active.

## Usage

Right-click any tab and choose **Lock Tab**. The tab will show a small 🔒 icon and can no longer be closed or dragged. Right-click again and choose **Unlock Tab** to release it.

## How it works

- **Closing** is blocked by wrapping `gBrowser.removeTab`, `gBrowser.removeTabs`, and `gBrowser.replaceTabWithWindow` (the functions Firefox/Zen use for closing, bulk-closing, and tearing a tab into its own window respectively) so they no-op on locked tabs.
- **Dragging** is blocked two ways: a `dragstart` listener stops native drag-and-drop before it begins (used by Essential tabs), and a `MutationObserver` watches locked tabs' position in the DOM, snapping them straight back if they're ever moved by Zen's custom drag logic for the normal tab list.

This two-layer approach makes the lock resilient even if Zen changes exactly how it implements tab dragging under the hood.

## Known limitations

- Locked tabs can still be closed by closing the entire window.
- This is a personal-use script, not a signed/reviewed extension — expect it to need small tweaks if a future Zen update renames internals like `tabContextMenu` or `gBrowser.replaceTabWithWindow`.

## Contributing

Issues and PRs welcome. If Zen changes its tab context menu or drag implementation and this breaks, please open an issue with your Zen version (`about:zen` or `about:support`).

## License

MIT
