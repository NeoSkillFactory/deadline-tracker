#!/usr/bin/env node
"use strict";

const RISK_COLORS = {
  none: "\x1b[32m",    // green
  low: "\x1b[32m",     // green
  medium: "\x1b[33m",  // yellow
  high: "\x1b[31m",    // red
  overdue: "\x1b[35m", // magenta
};
const RESET = "\x1b[0m";

const RISK_ICONS = {
  none: "[OK]",
  low: "[OK]",
  medium: "[!!]",
  high: "[!!]",
  overdue: "[XX]",
};

class Reporter {
  static generateText(status, { color = true } = {}) {
    const lines = [];
    const c = (risk, text) =>
      color ? `${RISK_COLORS[risk] || ""}${text}${RESET}` : text;

    lines.push("=== Deadline Tracker Report ===");
    lines.push(`Generated: ${status.generatedAt}`);
    lines.push("");

    // Summary
    const s = status.summary;
    lines.push("--- Summary ---");
    lines.push(`Total tasks:    ${s.total}`);
    lines.push(`Completed:      ${s.completed}/${s.total}`);
    lines.push(`Avg progress:   ${s.avgProgress}%`);
    lines.push(
      `At risk:        ${s.atRisk > 0 ? c("high", String(s.atRisk)) : "0"}`
    );
    lines.push(
      `Overdue:        ${s.overdue > 0 ? c("overdue", String(s.overdue)) : "0"}`
    );
    lines.push(
      `Overall status: ${s.allOnTrack ? c("low", "ON TRACK") : c("high", "NEEDS ATTENTION")}`
    );
    lines.push("");

    // Tasks
    lines.push("--- Tasks ---");
    for (const task of status.tasks) {
      const icon = RISK_ICONS[task.risk] || "[??]";
      const progressBar = Reporter._progressBar(task.progress);
      const daysStr =
        task.daysRemaining >= 0
          ? `${task.daysRemaining} days left`
          : `${Math.abs(task.daysRemaining)} days overdue`;

      lines.push(
        `${c(task.risk, icon)} ${task.name}`
      );
      lines.push(
        `     Progress: ${progressBar} ${task.progress}%`
      );
      lines.push(
        `     Deadline: ${task.deadline} (${c(task.risk, daysStr)})`
      );
      lines.push(
        `     Risk:     ${c(task.risk, task.risk.toUpperCase())}`
      );
      lines.push("");
    }

    return lines.join("\n");
  }

  static generateMarkdown(status) {
    const lines = [];

    lines.push("# Deadline Tracker Report");
    lines.push("");
    lines.push(`**Generated:** ${status.generatedAt}`);
    lines.push("");

    // Summary table
    const s = status.summary;
    lines.push("## Summary");
    lines.push("");
    lines.push("| Metric | Value |");
    lines.push("|--------|-------|");
    lines.push(`| Total tasks | ${s.total} |`);
    lines.push(`| Completed | ${s.completed}/${s.total} |`);
    lines.push(`| Avg progress | ${s.avgProgress}% |`);
    lines.push(`| At risk | ${s.atRisk} |`);
    lines.push(`| Overdue | ${s.overdue} |`);
    lines.push(
      `| Status | ${s.allOnTrack ? "ON TRACK" : "NEEDS ATTENTION"} |`
    );
    lines.push("");

    // Tasks
    lines.push("## Tasks");
    lines.push("");

    for (const task of status.tasks) {
      const emoji =
        task.risk === "overdue"
          ? "🔴"
          : task.risk === "high"
            ? "🟠"
            : task.risk === "medium"
              ? "🟡"
              : "🟢";
      const daysStr =
        task.daysRemaining >= 0
          ? `${task.daysRemaining} days remaining`
          : `${Math.abs(task.daysRemaining)} days overdue`;

      lines.push(`### ${emoji} ${task.name}`);
      lines.push("");
      lines.push(`- **Progress:** ${task.progress}%`);
      lines.push(`- **Deadline:** ${task.deadline} (${daysStr})`);
      lines.push(`- **Risk:** ${task.risk.toUpperCase()}`);
      lines.push(`- **On Track:** ${task.onTrack ? "Yes" : "No"}`);
      lines.push("");
    }

    return lines.join("\n");
  }

  static generateJSON(status) {
    return JSON.stringify(status, null, 2);
  }

  static _progressBar(progress, width = 20) {
    const filled = Math.round((progress / 100) * width);
    const empty = width - filled;
    return `[${"#".repeat(filled)}${"-".repeat(empty)}]`;
  }
}

module.exports = { Reporter };
