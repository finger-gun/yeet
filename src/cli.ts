#!/usr/bin/env node
import 'dotenv/config';
import path from 'path';
import { Command, Option } from 'commander';
import {
  Agent,
  SimpleTools,
  InMemoryKV,
  NullStream,
  createConsoleLogger,
  type Ctx,
} from '@sisu-ai/core';
import { openAIAdapter } from '@sisu-ai/adapter-openai';
import { registerTools } from '@sisu-ai/mw-register-tools';
import { inputToMessage, conversationBuffer } from '@sisu-ai/mw-conversation-buffer';
import { toolCalling } from '@sisu-ai/mw-tool-calling';
import { errorBoundary } from '@sisu-ai/mw-error-boundary';
import { traceViewer } from '@sisu-ai/mw-trace-viewer';
import { skillsMiddleware } from '@sisu-ai/mw-skills';
import { createTerminalTool } from '@sisu-ai/tool-terminal';

const SKILLS_DIR = path.join(__dirname, '..', '.sisu', 'skills');
const INVOCATION_DIR = process.env.INIT_CWD ?? process.cwd();

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
    });

    const model = openAIAdapter({ model: 'gpt-5.5' });

    const ctx: Ctx = {
      input: `Compile the Yeet project located at: ${projectDir}`,
      messages: [
        {
          role: 'system',
          content:
            'You are the Yeet compiler. Use the yeet-compile skill to compile .yeet markdown source files into working code.',
        },
      ],
      model,
      tools: new SimpleTools(),
      memory: new InMemoryKV(),
      stream: new NullStream(),
      state: {},
      signal: new AbortController().signal,
      log: createConsoleLogger({ level: 'info' }),
    };

    const app = new Agent()
      .use(errorBoundary(async (err, c) => { c.log.error(err); }))
      .use(traceViewer())
      .use(skillsMiddleware({ directory: SKILLS_DIR }))
      .use(
        registerTools(terminal.tools, {
          aliases: {
            terminalRun: 'bash',
            terminalReadFile: 'read_file',
            terminalCd: 'cd',
          },
        }),
      )
      .use(inputToMessage)
      .use(conversationBuffer({ window: 20 }))
      .use(toolCalling);

    await app.handler()(ctx);
    console.log('✅ Compilation complete!');
  });

program.parse();
