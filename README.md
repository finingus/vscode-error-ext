# File Error Navigator

Navigate errors and warnings in the current file directly from the Visual Studio Code status bar.

File Error Navigator adds **Previous** and **Next** controls alongside a live **current/total** diagnostic counter. Move through problems without repeatedly opening the Problems panel, and jump straight to the relevant diagnostic in your editor.

## Features

- **At-a-glance diagnostics:** See your position among the errors and warnings in the active file.
- **Previous / next navigation:** Jump between diagnostics in document order, wrapping around at either end.
- **Contextual navigation:** When the cursor isn't on a diagnostic, navigation starts from the nearest diagnostic in the chosen direction.
- **Diagnostic details:** Navigating to a problem moves the cursor, reveals its location, and displays the editor hover.
- **Live updates:** The counter responds to cursor movement, editor changes, and updated diagnostics.
- **Problems panel shortcut:** Click the counter to open VS Code's Problems view.
- **Unobtrusive status bar:** Controls are disabled when the current file has no errors or warnings and hidden when no text editor is active.

> **Note:** The counter includes diagnostics with **Error** or **Warning** severity. It does not include Information or Hint diagnostics.

## How it works

The right side of the status bar contains three items:

| Control | Action |
| --- | --- |
| **↑** | Go to the previous error or warning |
| **`1/5`** | Show the current diagnostic index out of the active file's total; click to open Problems |
| **↓** | Go to the next error or warning |

If your cursor isn't on a diagnostic, the counter shows `0/N` until you select or navigate to one. Navigation wraps from the last diagnostic to the first, and vice versa. When there are no errors or warnings, the counter shows `0/0` and navigation is disabled.

## Commands

Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`) and search for:

| Command | ID |
| --- | --- |
| **Error Navigator: Previous Error** | `errorNav.previous` |
| **Error Navigator: Next Error** | `errorNav.next` |

You can also bind these commands to keyboard shortcuts in VS Code.

## Requirements

- **Visual Studio Code 1.90.0** or newer.
- A file with diagnostics produced by VS Code or an installed language extension (for example, a language server or linter).

No additional runtime dependencies or configuration are required by the extension.

## Development

The project is written in TypeScript and uses [Bun](https://bun.sh/) for package management and scripts.

```bash
git clone https://github.com/finingus/vscode-error-ext.git
cd vscode-error-ext
bun install
bun run compile
```

Open the repository in VS Code and press **F5** to launch the **Extension Development Host**. Open a file with errors or warnings to try the status bar controls.

### Available scripts

| Command | Description |
| --- | --- |
| `bun run compile` | Compile TypeScript to `out/` |
| `bun run watch` | Recompile automatically when files change |
| `bun run typecheck` | Type-check without emitting files |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Automatically fix supported lint issues |
| `bun run format` | Format files using Prettier |
| `bun run check` | Run type-checking, linting, and formatting |
| `bun run package` | Check, compile, and package the extension as a VSIX |

You can install a locally generated `.vsix` from VS Code's **Extensions → … → Install from VSIX…** menu.

## Implementation

The extension is built on the [VS Code Extension API](https://code.visualstudio.com/api) and uses:

- `vscode.languages.getDiagnostics()` to obtain diagnostics for the active document.
- `vscode.window.createStatusBarItem()` to render the navigation controls and counter.
- Editor-selection, active-editor, and diagnostics-change events to keep the UI synchronized.
- Diagnostic caching and conditional status bar updates to avoid unnecessary work on cursor movement.
- VS Code commands to reveal the selected diagnostic and show its hover message.

The code is in [`src/extension.ts`](src/extension.ts). Extension metadata and contributed commands are defined in [`package.json`](package.json).

## Publishing

The [GitHub Actions workflow](.github/workflows/publish.yml) is configured to publish the extension with `@vscode/vsce` using OIDC when a Git tag is pushed.

## License

The repository includes a [`LICENSE.txt`](LICENSE.txt) file, but it is currently empty. Add license terms before presenting the project as licensed for reuse.
