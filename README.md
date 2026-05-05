# yeet

Yeet! Markdown Coding Language Powered By Your AI

Write your application in plain English using `.yeet` markdown files. Run `yeet compile` and AI turns your descriptions into a fully working codebase.

## How It Works

- **`.yeet` files** — describe what each module should do in plain English
- **`config.yeet`** — project config (target language, runtime, etc.)
- **`.test.yeet` files** — describe what tests should verify
- **`yeet compile`** — AI reads all `.yeet` files and compiles them into real code

The compiler is powered by [Sisu AI Framework](https://github.com/finger-gun/sisu) using GPT-5.5.

## Installation

```bash
npm install -g yeet
```

## Setup

Copy `.env.example` to `.env` and add your OpenAI API key:

```bash
cp .env.example .env
# edit .env and set API_KEY=your-openai-api-key
```

## Usage

### 1. Create a project

Create a `config.yeet` to specify your target language:

```
Language: TypeScript
Runtime: Node.js
```

### 2. Write your app in plain English

**`App.yeet`**
```
When the app runs, print "Hello World!" to the console once, then exit.
```

### 3. Compile

```bash
yeet compile
```

The compiled project is written to `dist/`.

### Multi-file project

**`App.yeet`**
```
Load Input.yeet

Take the text value returned by Input.yeet and print it to the console.
```

**`Input.yeet`**
```
Display a prompt asking the user to enter some text.
Read a single line of input from stdin.
Return the entered text to the caller.
```

Files can reference each other — the compiler resolves imports automatically.

## Examples

| Example | Description |
|---------|-------------|
| `examples/hello-world/` | Single-file Hello World |
| `examples/input-app/` | Multi-file app with user input |

Run an example:

```bash
yeet compile --dir examples/hello-world
cd examples/hello-world/dist
npm install && npm start
```

## CLI Reference

```
yeet compile [options]

Options:
  -d, --dir <path>  Project directory to compile (default: current directory)
  -V, --version     output the version number
  -h, --help        display help for command
```

## Development

```bash
npm install
npm run build    # compile TypeScript → dist/
npm run dev      # run with tsx (no build step)
npm run lint     # type-check only
```

## How the Compiler Works

The minimal TypeScript CLI (`src/cli.ts`) wires together a Sisu agent with:

- **Terminal tools** — so the AI can read `.yeet` files and write compiled output
- **Skills middleware** — loads `.sisu/skills/compile/SKILL.md` which contains the full compiler instructions in markdown

The skill (`SKILL.md`) teaches the AI how to:
1. Parse `config.yeet` for the target language
2. Discover all `.yeet` source files
3. Resolve cross-file imports/references
4. Generate complete, working code in the target language
5. Write output files to `dist/`

A trace of every compilation run is saved to `traces/` — open `traces/viewer.html` to inspect exactly what the AI did.
