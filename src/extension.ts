import * as vscode from "vscode";

// Figure spaces are digit-wide, so padding with them keeps the counter from changing width.
const FIGURE_SPACE = "\u2007";
const MIN_DIGITS = 2;

// Right-aligned items are ordered by descending priority, so the lowest possible values land at the far right.
const BASE_PRIORITY = Number.MIN_SAFE_INTEGER;

function createItem(
  id: string,
  name: string,
  priority: number,
  text: string,
  command: string,
): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(
    id,
    vscode.StatusBarAlignment.Right,
    priority,
  );

  item.name = name;
  item.text = text;
  item.command = command;

  return item;
}

const prevItem = createItem(
  "errorNav.previous",
  "Error Navigator: Previous",
  BASE_PRIORITY + 1,
  "$(arrow-up)",
  "errorNav.previous",
);

const counterItem = createItem(
  "errorNav.counter",
  "Error Navigator: Counter",
  BASE_PRIORITY + 2,
  "",
  "workbench.actions.view.problems",
);

const nextItem = createItem(
  "errorNav.next",
  "Error Navigator: Next",
  BASE_PRIORITY,
  "$(arrow-down)",
  "errorNav.next",
);

prevItem.tooltip = "Previous Error";
nextItem.tooltip = "Next Error";
counterItem.color = new vscode.ThemeColor("errorForeground");

const items = [counterItem, prevItem, nextItem];

const arrows = [
  { item: prevItem, command: "errorNav.previous", tooltip: "Previous Error" },
  { item: nextItem, command: "errorNav.next", tooltip: "Next Error" },
];

const DISABLED_COLOR = new vscode.ThemeColor("disabledForeground");
let itemsVisible = false;
let arrowsEnabled = true;
let cached: { uri: string; problems: vscode.Diagnostic[] } | undefined;
let lastTarget = -1;

function getProblems(uri: vscode.Uri): vscode.Diagnostic[] {
  const key = uri.toString();

  if (cached?.uri !== key) {
    cached = {
      uri: key,
      problems: vscode.languages
        .getDiagnostics(uri)
        .filter(
          (d) =>
            d.severity === vscode.DiagnosticSeverity.Error ||
            d.severity === vscode.DiagnosticSeverity.Warning,
        )
        .sort((a, b) => a.range.start.compareTo(b.range.start)),
    };

    lastTarget = -1;
  }

  return cached.problems;
}

function currentIndex(
  errors: vscode.Diagnostic[],
  pos: vscode.Position,
): number {
  // Overlapping diagnostics would otherwise always resolve to the first one, trapping navigation.
  if (
    lastTarget !== -1 &&
    lastTarget < errors.length &&
    errors[lastTarget].range.start.isEqual(pos)
  ) {
    return lastTarget;
  }

  const i = errors.findIndex((d) => d.range.contains(pos));

  return i !== -1
    ? i
    : errors.findIndex((d) => d.range.start.line === pos.line);
}

function setVisible(visible: boolean): void {
  if (itemsVisible === visible) {
    return;
  }

  itemsVisible = visible;

  for (const item of items) {
    if (visible) {
      item.show();
    } else {
      item.hide();
    }
  }
}

function setArrowsEnabled(enabled: boolean): void {
  if (arrowsEnabled === enabled) {
    return;
  }

  arrowsEnabled = enabled;

  // Status bar items have no disabled state, so drop the command and dim the icon instead.
  for (const { item, command, tooltip } of arrows) {
    item.command = enabled ? command : undefined;
    item.color = enabled ? undefined : DISABLED_COLOR;
    item.tooltip = enabled ? tooltip : "No problems in file";
  }
}

function update(): void {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    setVisible(false);

    return;
  }

  const errors = getProblems(editor.document.uri);
  const index = currentIndex(errors, editor.selection.active);
  const width = Math.max(MIN_DIGITS, String(errors.length).length);
  const current = String(index + 1).padStart(width, FIGURE_SPACE);
  const total = String(errors.length).padEnd(width, FIGURE_SPACE);

  const text = `${current}/${total}`;

  const tooltip =
    index === -1
      ? `${errors.length} problem${errors.length === 1 ? "" : "s"} in file. Click to open the Problems panel.`
      : `Problem ${index + 1} of ${errors.length}. Click to open the Problems panel.`;

  // Every setter call is an IPC round-trip to the renderer, and this runs on each cursor move.
  if (counterItem.text !== text) {
    counterItem.text = text;
  }

  if (counterItem.tooltip !== tooltip) {
    counterItem.tooltip = tooltip;
  }

  setArrowsEnabled(errors.length > 0);

  setVisible(true);
}

async function reveal(
  editor: vscode.TextEditor,
  range: vscode.Range,
): Promise<void> {
  // A visible hover would just get focused by showHover instead of refreshed, so close it first.
  await vscode.commands.executeCommand("editor.action.hideHover");

  // Clicking a status bar item takes focus away from the editor; restore it so the hover can show.
  const focused = await vscode.window.showTextDocument(
    editor.document,
    editor.viewColumn,
  );

  focused.selection = new vscode.Selection(range.start, range.start);

  focused.revealRange(
    range,
    vscode.TextEditorRevealType.InCenterIfOutsideViewport,
  );

  await vscode.commands.executeCommand("editor.action.showHover");
}

async function navigate(direction: 1 | -1): Promise<void> {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  const errors = getProblems(editor.document.uri);

  if (errors.length === 0) {
    return;
  }

  const pos = editor.selection.active;
  const n = errors.length;
  const current = currentIndex(errors, pos);
  let target: number;

  if (current !== -1) {
    target = (current + direction + n) % n;
  } else if (direction === 1) {
    const next = errors.findIndex((d) => d.range.start.isAfter(pos));

    target = next === -1 ? 0 : next;
  } else {
    const prev = errors.findLastIndex((d) => d.range.start.isBefore(pos));

    target = prev === -1 ? n - 1 : prev;
  }

  lastTarget = target;

  await reveal(editor, errors[target].range);
}

export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    prevItem,
    counterItem,
    nextItem,
    vscode.commands.registerCommand("errorNav.next", () => navigate(1)),
    vscode.commands.registerCommand("errorNav.previous", () => navigate(-1)),
    vscode.window.onDidChangeActiveTextEditor(update),
    vscode.window.onDidChangeTextEditorSelection((e) => {
      if (e.textEditor === vscode.window.activeTextEditor) {
        update();
      }
    }),
    vscode.languages.onDidChangeDiagnostics((e) => {
      const key = cached?.uri;

      if (key !== undefined && e.uris.some((u) => u.toString() === key)) {
        cached = undefined;

        update();
      }
    }),
  );

  update();
}
