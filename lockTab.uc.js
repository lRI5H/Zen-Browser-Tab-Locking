// ==UserScript==
// @name           Lock Tab
// @description    Adds a "Lock Tab" option to the tab context menu. Locked
//                 tabs cannot be closed (X button, Ctrl+W, middle-click,
//                 "Close Other Tabs", etc.) or dragged to a new position.
// @include        main
// ==/UserScript==

(function () {
  "use strict";

  const LOCK_ATTR = "zen-locked-tab";

  function init() {
    if (!window.gBrowser) {
      window.setTimeout(init, 300);
      return;
    }
    injectStyles();
    patchTabClose();
    patchDrag();
    watchTabPositions();
    addContextMenuItem();
  }

  function injectStyles() {
    const css = `
      .tabbrowser-tab[${LOCK_ATTR}] .tab-close-button {
        display: none !important;
      }
      .tabbrowser-tab[${LOCK_ATTR}] .tab-icon-stack {
        position: relative;
      }
      .tabbrowser-tab[${LOCK_ATTR}] .tab-icon-stack::after {
        content: "🔒";
        font-size: 8px;
        line-height: 1;
        position: absolute;
        bottom: -3px;
        right: -3px;
        pointer-events: none;
      }
    `;
    const style = document.createElement("style");
    style.textContent = css;
    document.documentElement.appendChild(style);
  }

  // Closing a tab in Firefox/Zen always funnels through gBrowser.removeTab
  // (the X button, Ctrl+W, middle-click, and removeCurrentTab all call it),
  // multi-tab closes (Close Other Tabs, Close Tabs to the Right, etc.)
  // funnel through gBrowser.removeTabs, and dragging a tab into its own
  // window funnels through gBrowser.replaceTabWithWindow. Patching all
  // three covers every way a tab can disappear from this window.
  function patchTabClose() {
    const gb = window.gBrowser;

    const originalRemoveTab = gb.removeTab.bind(gb);
    gb.removeTab = function (tab, options) {
      if (tab && tab.hasAttribute(LOCK_ATTR)) {
        return undefined;
      }
      return originalRemoveTab(tab, options);
    };

    if (typeof gb.removeTabs === "function") {
      const originalRemoveTabs = gb.removeTabs.bind(gb);
      gb.removeTabs = function (tabs, options) {
        const filtered = tabs.filter((t) => !t.hasAttribute(LOCK_ATTR));
        return originalRemoveTabs(filtered, options);
      };
    }

    // Dragging a tab clear of the tab strip tears it into a new window via
    // this function. Blocking it directly is far more reliable than trying
    // to catch the drag partway through.
    if (typeof gb.replaceTabWithWindow === "function") {
      const originalReplaceTabWithWindow = gb.replaceTabWithWindow.bind(gb);
      gb.replaceTabWithWindow = function (tab, options) {
        if (tab && tab.hasAttribute(LOCK_ATTR)) {
          return undefined;
        }
        return originalReplaceTabWithWindow(tab, options);
      };
    }
  }

  // Intercept dragstart at the capture phase, before Zen/Firefox's own
  // tab-reordering handler sees it, so a locked tab simply never starts
  // a drag operation.
  function patchDrag() {
    document.addEventListener(
      "dragstart",
      (event) => {
        const tab = event.target.closest && event.target.closest(".tabbrowser-tab");
        if (tab && tab.hasAttribute(LOCK_ATTR)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          event.stopPropagation();
        }
      },
      true
    );
  }

  // Essential tabs use native drag-and-drop, which dragstart catches (see
  // patchDrag above). The normal vertical tab list uses Zen's own custom
  // drag logic instead, which never fires a dragstart event. Rather than
  // reverse-engineer that mechanism (and risk it changing later), we just
  // watch the DOM: whenever a locked tab's node itself gets moved, for any
  // reason, snap it straight back to where it was. This works no matter
  // which drag system moved it.
  function captureAnchor(tab) {
    tab._zenLockParent = tab.parentNode;
    tab._zenLockNext = tab.nextElementSibling;
    tab._zenLockPrev = tab.previousElementSibling;
  }

  function restoreTabPosition(tab) {
    const parent = tab._zenLockParent;
    if (!parent || !parent.isConnected) return;

    const anchorNext = tab._zenLockNext;
    if (anchorNext && anchorNext.isConnected && anchorNext.parentNode === parent) {
      if (tab.nextElementSibling !== anchorNext) {
        parent.insertBefore(tab, anchorNext);
      }
      return;
    }

    const anchorPrev = tab._zenLockPrev;
    if (anchorPrev && anchorPrev.isConnected && anchorPrev.parentNode === parent) {
      const target = anchorPrev.nextElementSibling;
      if (tab.previousElementSibling !== anchorPrev) {
        parent.insertBefore(tab, target);
      }
    }
  }

  function watchTabPositions() {
    const target = document.getElementById("browser") || document.documentElement;

    const observer = new MutationObserver((mutations) => {
      const movedLockedTabs = new Set();
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType === 1 && node.hasAttribute && node.hasAttribute(LOCK_ATTR)) {
            movedLockedTabs.add(node);
          }
        }
      }
      for (const tab of movedLockedTabs) {
        restoreTabPosition(tab);
      }
      // Keep anchors in sync with legitimate neighbor changes (tabs opening/
      // closing nearby), so we don't "correct" against a stale reference.
      document.querySelectorAll(`.tabbrowser-tab[${LOCK_ATTR}]`).forEach(captureAnchor);
    });

    observer.observe(target, { childList: true, subtree: true });
  }

  function addContextMenuItem() {
    const menu = document.getElementById("tabContextMenu");
    if (!menu) {
      window.setTimeout(addContextMenuItem, 300);
      return;
    }

    const menuitem = document.createXULElement("menuitem");
    menuitem.id = "context_zenLockTabToggle";
    menuitem.setAttribute("label", "Lock Tab");

    menu.addEventListener("popupshowing", () => {
      const tab = (typeof TabContextMenu !== "undefined" && TabContextMenu.contextTab) || gBrowser.selectedTab;
      const locked = tab && tab.hasAttribute(LOCK_ATTR);
      menuitem.setAttribute("label", locked ? "Unlock Tab" : "Lock Tab");
    });

    menuitem.addEventListener("command", () => {
      const tab = (typeof TabContextMenu !== "undefined" && TabContextMenu.contextTab) || gBrowser.selectedTab;
      if (!tab) return;
      if (tab.hasAttribute(LOCK_ATTR)) {
        tab.removeAttribute(LOCK_ATTR);
        delete tab._zenLockParent;
        delete tab._zenLockNext;
        delete tab._zenLockPrev;
      } else {
        tab.setAttribute(LOCK_ATTR, "true");
        captureAnchor(tab);
      }
    });

    const closeItem = document.getElementById("context_closeTab");
    if (closeItem && closeItem.parentNode === menu) {
      menu.insertBefore(menuitem, closeItem);
    } else {
      menu.appendChild(menuitem);
    }
  }

  if (document.readyState === "complete") {
    init();
  } else {
    window.addEventListener("load", init, { once: true });
  }
})();
