#!/usr/bin/env node
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'path';
import { Command, Option } from 'commander';
import {
  Agent,
  createCtx,
  execute,
  getExecutionResult,
  parseLogLevel,
  type Ctx,
} from '@sisu-ai/core';
import { openAIAdapter } from '@sisu-ai/adapter-openai';
import { registerTools } from '@sisu-ai/mw-register-tools';
import { inputToMessage, conversationBuffer } from '@sisu-ai/mw-conversation-buffer';
import { errorBoundary } from '@sisu-ai/mw-error-boundary';
import { traceViewer } from '@sisu-ai/mw-trace-viewer';
import { skillsMiddleware } from '@sisu-ai/mw-skills';
import { createTerminalTool } from '@sisu-ai/tool-terminal';

const SKILLS_DIR = path.join(__dirname, '..', '.sisu', 'skills');
const INVOCATION_DIR = process.env.INIT_CWD ?? process.cwd();

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(entryPath);
      }
      return [entryPath];
    }),
  );

  return files.flat();
}

const program = new Command();

program
  .name('yeet')
  .description('Yeet! Markdown Coding Language Powered By Your AI')
  .version('1.0.0');

program
  .command('compile')
  .description('Compile all .yeet files in the current folder using AI')
  .addOption(
    new Option('-d, --dir <path>', 'Project directory to compile').default(
      '.',
      'current directory',
    ),
  )
  .action(async (options) => {
    const projectDir = path.resolve(INVOCATION_DIR, options.dir);
    console.log(`🚀 Compiling Yeet project at: ${projectDir}`);

    const terminal = createTerminalTool({
      roots: [projectDir],
      capabilities: { read: true, write: true, delete: false, exec: true },
      commands: {
        allow: [
          'pwd',
          'ls',
          'stat',
          'wc',
          'head',
          'tail',
          'cat',
          'cut',
          'sort',
          'uniq',
          'grep',
          'find',
          'mkdir',
          'tee',
        ],
      },
    });

    const ctx = createCtx({
      model: openAIAdapter({ model: process.env.MODEL || 'gpt-5.5' }),
      input: `Compile the Yeet project located at: ${projectDir}`,
      systemPrompt:
        'You are the Yeet compiler. Use the yeet-compile skill to compile .yeet markdown source files into working code.',
      logLevel: parseLogLevel(process.env.LOG_LEVEL) ?? 'warn',
    });

    const app = new Agent()
      .use(errorBoundary(async (err: unknown, c: Ctx) => {
        c.log.error(err);
        throw err;
      }))
      .use(traceViewer())
      .use(
        registerTools(terminal.tools, {
          aliases: {
            terminalRun: 'bash',
            terminalReadFile: 'read_file',
            terminalCd: 'cd',
          },
        }),
      )
      .use(skillsMiddleware({ directory: SKILLS_DIR }))
      .use(inputToMessage)
      .use(conversationBuffer({ window: 20 }))
      .use(execute);

    await app.handler()(ctx);
    const result = getExecutionResult(ctx);
    if (result?.text) {
      console.log(result.text);
    }

    const outputDir = path.join(projectDir, 'dist');
    const compiledFiles = await listFiles(outputDir).catch(() => []);
    if (compiledFiles.length === 0) {
      throw new Error(`Compilation did not write any files to ${outputDir}`);
    }

    console.log('✅ Compilation complete!');
  });

program.parse();
