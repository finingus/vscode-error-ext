# File Error Navigator

A small status bar addition for VS Code. It shows how many problems the current file has and which one your cursor is on, with up and down arrows to jump between them.

The counter reads `current/total`, like `03/12`, and sits at the far right of the status bar with the arrows next to it. It updates as you move around, edit, or switch files. If the cursor isn't on a problem, the current number shows `0`. Click the counter to open the Problems panel.

It counts errors and warnings and skips info and hints. Jumping wraps around, so next on the last problem takes you to the first. Each jump puts focus back in the editor, scrolls the problem into view if it needs to, and opens its hover so you can read the message right away.

If the file has no problems, the arrows are dimmed and do nothing. With no text editor open, all three items hide.

## Commands and shortcuts

There are two commands, both in the Command Palette:

- `Error Navigator: Previous Error` (`errorNav.previous`)
- `Error Navigator: Next Error` (`errorNav.next`)

They also come with default keybindings, which are on unless you set `errorNav.enableKeybindings` to `false`. They work whenever an editor has focus:

- Previous: `Ctrl+Alt+PageDown`
- Next: `Ctrl+Alt+PageUp`

To use other keys, open Keyboard Shortcuts (`Ctrl+K Ctrl+S`) and search for `errorNav`. If you write your own binding in `keybindings.json`, it ignores the setting unless you add `config.errorNav.enableKeybindings` to its `when` clause:

```json
{
  "key": "alt+n",
  "command": "errorNav.next",
  "when": "editorTextFocus && config.errorNav.enableKeybindings"
}
```

## Requirements

VS Code 1.90.0 or newer. The problems come from your language servers and linters, so if nothing reports problems for a language, the counter just stays at `0/0`.

## Development

```sh
bun install
bun run watch      # compile on change
bun run check      # typecheck, lint and format
bun run package    # produces a .vsix
```

## License

The license is in [LICENSE.txt](LICENSE.txt).
