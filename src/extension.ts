import * as vscode from "vscode";

// Figure spaces are digit-wide, so padding with them keeps the counter from changing width.
const FIGURE_SPACE = "\u2007";
const MIN_DIGITS = 2;

// Right-aligned items are ordered by descending priority, so the lowest possible values land at the far right.
const BASE_PRIORITY = Number.MIN_SAFE_INTEGER;

function createItem(
  id: string,
  priority: number,
  text: string,
  command: string,
): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(
    id,
    vscode.StatusBarAlignment.Right,
    priority,
  );

  item.name = "Error Navigator";
  item.text = text;
  item.command = command;

  return item;
}

const prevItem = createItem(
  "errorNav.previous",
  BASE_PRIORITY + 2,
  "$(arrow-up)",
  "errorNav.previous",
);

const counterItem = createItem(
  "errorNav.counter",
  BASE_PRIORITY + 1,
  "",
  "workbench.actions.view.problems",
);

const nextItem = createItem(
  "errorNav.next",
  BASE_PRIORITY,
  "$(arrow-down)",
  "errorNav.next",
);

prevItem.tooltip = "Previous Error";
nextItem.tooltip = "Next Error";
counterItem.color = new vscode.ThemeColor("errorForeground");

function getProblems(uri: vscode.Uri): vscode.Diagnostic[] {
  return vscode.languages
    .getDiagnostics(uri)
    .filter(
      (d) =>
        d.severity === vscode.DiagnosticSeverity.Error ||
        d.severity === vscode.DiagnosticSeverity.Warning,
    )
    .sort((a, b) => a.range.start.compareTo(b.range.start));
}

function currentIndex(
  errors: vscode.Diagnostic[],
  pos: vscode.Position,
): number {
  const i = errors.findIndex((d) => d.range.contains(pos));

  return i !== -1
    ? i
    : errors.findIndex((d) => d.range.start.line === pos.line);
}

function update(): void {
  const editor = vscode.window.activeTextEditor;
  const items = [prevItem, counterItem, nextItem];

  if (!editor) {
    items.forEach((item) => {
      item.hide();
    });

    return;
  }

  const errors = getProblems(editor.document.uri);
  const index = currentIndex(errors, editor.selection.active);
  const width = Math.max(MIN_DIGITS, String(errors.length).length);
  const current = String(index + 1).padStart(width, FIGURE_SPACE);
  const total = String(errors.length).padEnd(width, FIGURE_SPACE);

  counterItem.text = `${current}/${total}`;

  counterItem.tooltip =
    index === -1
      ? `${errors.length} problem${errors.length === 1 ? "" : "s"} in file. Click to open the Problems panel.`
      : `Problem ${index + 1} of ${errors.length}. Click to open the Problems panel.`;

  items.forEach((item) => {
    item.show();
  });
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
      const active = vscode.window.activeTextEditor?.document.uri.toString();

      if (active && e.uris.some((u) => u.toString() === active)) {
        update();
      }
    }),
  );

  update();
}
