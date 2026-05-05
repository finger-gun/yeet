---
name: yeet-compile
description: Compile all .yeet markdown source files in a Yeet project into working code in the target language specified by config.yeet
version: 1.0.0
author: yeet
tags: [compile, yeet, code-generation]
requires: [read_file, bash, cd]
---

# Yeet Compiler

You are compiling a **Yeet project**. Yeet is a coding language where developers describe application behaviour in plain English using `.yeet` markdown files, and an AI compiler (you) translates those descriptions into real, working code.

## File Types

| File | Purpose |
|------|---------|
| `config.yeet` | Project config — specifies target language/runtime |
| `*.yeet` | Source files — plain English descriptions of what each module should do |
| `*.test.yeet` | Test files — descriptions of what tests should verify (skip during normal compile) |

## Step-by-Step Compilation

### 1. Change to the Project Directory

Use `cd` to move into the project directory that was provided.

### 2. Read Project Configuration

Use `read_file` to read `config.yeet`. It specifies the target language and any other project settings.

Example `config.yeet`:
```
Language: TypeScript
Runtime: Node.js
```

Parse the language and runtime. If `config.yeet` is missing, default to TypeScript/Node.js.

### 3. Discover All Source Files

Use `bash` to list all `.yeet` source files, excluding config and test files:

```bash
find . -name "*.yeet" ! -name "config.yeet" ! -name "*.test.yeet" -type f | sort
```

### 4. Read Each Source File

Use `read_file` to read every discovered `.yeet` file. Note each file's name and content.

### 5. Resolve Cross-File References

`.yeet` files can reference other `.yeet` files. Look for phrases like:
- `Load Input.yeet`
- `Use Input.yeet`
- `Import Input.yeet`
- `Take output from Input.yeet`

Build a dependency map so you can generate correct import/require statements between modules.

### 6. Generate Code

Translate every `.yeet` source file into code in the target language. Follow these rules:

- Each `Name.yeet` compiles to a corresponding output file (e.g. `App.yeet` → `dist/App.ts`)
- Implement everything described in plain English — do not leave stubs or TODOs
- Cross-file references become real imports (e.g. `import { ... } from './Input'`)
- The entry point (`App.yeet` or the first file found) should be runnable directly
- For TypeScript/Node: export functions/classes from each module, import them in `App.ts`

### 7. Write the Output Files

Use `bash` to create the output directory and write each generated file:

```bash
mkdir -p dist
```

Then write each file with `tee` and the `stdin` tool argument. Do **not** use shell redirection (`>`) or heredocs because the terminal tool runs commands without a shell. For example, call `bash` with `command: "tee dist/App.ts"` and pass the generated code as `stdin`.

```bash
tee dist/App.ts
```

### 8. Generate Project Boilerplate

After writing source files, generate any boilerplate needed to make the project runnable:

**TypeScript / Node.js** — write `dist/package.json` and `dist/tsconfig.json` with `tee` and `stdin`:

```bash
tee dist/package.json
```

Use this JSON as the `stdin`:

```json
{
  "name": "yeet-app",
  "version": "1.0.0",
  "scripts": { "start": "ts-node App.ts", "build": "tsc" },
  "dependencies": {},
  "devDependencies": { "typescript": "^5.0.0", "ts-node": "^10.0.0", "@types/node": "^22.0.0" }
}
```

For other languages generate the appropriate project/build files.

### 9. Report Results

After writing all files, print a summary:
- List every file written to `dist/`
- Note the target language used
- Mention how to run the compiled project (e.g. `cd dist && npm install && npm start`)
