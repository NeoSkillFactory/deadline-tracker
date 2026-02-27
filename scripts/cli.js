#!/usr/bin/env node
"use strict";

const { Tracker } = require("./tracker");
const { Reporter } = require("./reporter");
const path = require("path");

const EXIT_CODES = {
  SUCCESS: 0,
  INVALID_ARGS: 1,
  FILE_NOT_FOUND: 2,
  INVALID_DATA: 3,
  INTERNAL_ERROR: 4,
};

function parseArgs(argv) {
  const args = argv.slice(2);
  const result = { command: null, options: {} };

  if (args.length === 0) {
    result.command = "help";
    return result;
  }

  result.command = args[0];

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      if (nextArg && !nextArg.startsWith("--")) {
        result.options[key] = nextArg;
        i++;
      } else {
        result.options[key] = true;
      }
    }
  }

  return result;
}

function printHelp() {
  console.log(`
deadline-tracker - Track and report task progress

USAGE:
  deadline-tracker <command> [options]

COMMANDS:
  status              Show status of all tracked tasks
  report              Generate a full progress report
  add                 Add a new task
  complete            Mark a task as complete
  help                Show this help message

OPTIONS:
  --file <path>       Path to tasks JSON file (default: tasks.json in cwd)
  --format <fmt>      Output format: text, markdown, json (default: text)
  --name <name>       Task name (for add/complete commands)
  --deadline <date>   Deadline date in YYYY-MM-DD format (for add command)
  --progress <num>    Progress percentage 0-100 (for add command, default: 0)
  --demo              Use demo data instead of a file
  --no-color          Disable colored output

EXIT CODES:
  0  Success
  1  Invalid arguments
  2  File not found
  3  Invalid task data
  4  Internal error

EXAMPLES:
  deadline-tracker status --demo
  deadline-tracker status --file my-tasks.json
  deadline-tracker report --format markdown --demo
  deadline-tracker add --name "Feature X" --deadline 2026-03-15
  deadline-tracker complete --name "Feature X"
`);
}

function loadTracker(options) {
  if (options.demo) {
    const tracker = new Tracker();
    const demoTasks = Tracker.getDemoTasks();
    for (const t of demoTasks) {
      tracker.tasks.push(t);
    }
    return tracker;
  }

  const filePath = options.file
    ? path.resolve(options.file)
    : path.resolve(process.cwd(), "tasks.json");

  const tracker = new Tracker(filePath);
  return tracker;
}

function runStatus(options) {
  const tracker = loadTracker(options);
  const status = tracker.getStatus();
  const format = options.format || "text";
  const noColor = options["no-color"] || false;

  switch (format) {
    case "json":
      console.log(Reporter.generateJSON(status));
      break;
    case "markdown":
    case "md":
      console.log(Reporter.generateMarkdown(status));
      break;
    case "text":
    default:
      console.log(Reporter.generateText(status, { color: !noColor }));
      break;
  }

  return status.summary.allOnTrack
    ? EXIT_CODES.SUCCESS
    : EXIT_CODES.SUCCESS; // status command always succeeds if data is valid
}

function runReport(options) {
  // Report is an alias for status with more detail - same output
  return runStatus(options);
}

function runAdd(options) {
  if (!options.name) {
    console.error("Error: --name is required for add command");
    return EXIT_CODES.INVALID_ARGS;
  }
  if (!options.deadline) {
    console.error("Error: --deadline is required for add command");
    return EXIT_CODES.INVALID_ARGS;
  }

  const tracker = loadTracker({ ...options, demo: false });
  const task = tracker.addTask({
    name: options.name,
    deadline: options.deadline,
    progress: Number(options.progress) || 0,
  });
  tracker.save();

  console.log(`Task added: "${task.name}" (deadline: ${task.deadline})`);
  return EXIT_CODES.SUCCESS;
}

function runComplete(options) {
  if (!options.name) {
    console.error("Error: --name is required for complete command");
    return EXIT_CODES.INVALID_ARGS;
  }

  const tracker = loadTracker({ ...options, demo: false });
  const task = tracker.completeTask(options.name);
  tracker.save();

  console.log(`Task completed: "${task.name}"`);
  return EXIT_CODES.SUCCESS;
}

function main() {
  const { command, options } = parseArgs(process.argv);

  try {
    let exitCode;

    switch (command) {
      case "status":
        exitCode = runStatus(options);
        break;
      case "report":
        exitCode = runReport(options);
        break;
      case "add":
        exitCode = runAdd(options);
        break;
      case "complete":
        exitCode = runComplete(options);
        break;
      case "help":
      case "--help":
      case "-h":
        printHelp();
        exitCode = EXIT_CODES.SUCCESS;
        break;
      default:
        console.error(`Unknown command: "${command}". Use "help" for usage.`);
        exitCode = EXIT_CODES.INVALID_ARGS;
        break;
    }

    process.exit(exitCode);
  } catch (err) {
    if (err.code === "ENOENT") {
      console.error(`Error: File not found - ${err.path || err.message}`);
      process.exit(EXIT_CODES.FILE_NOT_FOUND);
    }
    if (err.message && err.message.includes("Invalid task")) {
      console.error(`Error: ${err.message}`);
      process.exit(EXIT_CODES.INVALID_DATA);
    }
    console.error(`Error: ${err.message}`);
    process.exit(EXIT_CODES.INTERNAL_ERROR);
  }
}

main();
