# Electric Color

VS Code extension that colors matching words, numbers, punctuation, and symbols throughout every text document.

## Run locally

1. Open this folder in VS Code.
2. Press `F5` and choose **Run Electric Color**.
3. In the Extension Development Host, open a plaintext or source-code file.

Run **Electric Color: Toggle Coloring** from the Command Palette to disable or enable decorations.

## Electric Shell

`electric-shell/` is a compiled Go CLI that wraps Fish (or your configured
`$SHELL`) in a real pseudo-terminal and applies the Electric Color rules to
plain terminal output. Existing ANSI and OSC terminal sequences are preserved.

- Run `npm run cli` for development without installing it.
- Run `npm run cli:install` once to install it in `~/.local/bin`.
- Then run `electric-shell` from any directory.
- Run `electric-shell --shell /opt/homebrew/bin/fish` to select Fish explicitly.
- Run `electric-shell -c "printf 'blue 42\n'"` for a single command.
- Pipe a shell script into `electric-shell` to execute it non-interactively.
- Use `--color` or `--no-color` to override automatic terminal color detection.

Interactive commands, history, completion, job control, and persistent `cd`
are provided directly by the wrapped shell rather than reimplemented by the CLI.

## Teams clipboard GUI

Open `web/index.html` in a browser, enter text, and select **Copy for Teams**.
The page puts both rich HTML and plain text on the clipboard, so Microsoft
Teams retains the Electric Color foregrounds and dark background while other
applications can fall back to unformatted text. Use **Command+Enter** to copy
without leaving the text box.

## Configuration

`electricColor.languages` lists language IDs colored throughout the document. Its default, `*`, colors every text document.

`electricColor.scopedLanguages` lists language IDs colored only inside comments and strings when `electricColor.languages` does not include `*` or that language ID.

```json
{
  "electricColor.languages": ["*"]
}
```

A language listed in `electricColor.languages` uses full-document mode even if also listed in `electricColor.scopedLanguages`.

## Source

- `src/colors.js`: matching rules and colors.
- `src/scopes.js`: comment and string scanner.
- `src/extension.js`: VS Code activation, editor events, command, and decorations.
- `electric-shell/`: standalone Go PTY wrapper, colorizer, and tests.
- `web/index.html`: standalone rich-text clipboard GUI.
- `web/colorizer.js`: browser colorizer and clipboard HTML renderer.
- `color.js` and `hooks.js`: original browser-DOM prototypes; not loaded by the extension.
- `canvas.js`: standalone Canvas 2D color rules and `fillText`/`strokeText` hooks.
