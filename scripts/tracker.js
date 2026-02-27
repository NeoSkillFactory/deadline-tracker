#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const RISK_THRESHOLDS = {
  high: 0.2,   // less than 20% time remaining relative to progress
  medium: 0.5, // less than 50% time remaining relative to progress
};

class Tracker {
  constructor(tasksFilePath) {
    this.tasks = [];
    this.tasksFilePath = tasksFilePath || null;
    if (this.tasksFilePath && fs.existsSync(this.tasksFilePath)) {
      this.load();
    }
  }

  load() {
    if (!this.tasksFilePath) {
      throw new Error("No tasks file path configured");
    }
    const raw = fs.readFileSync(this.tasksFilePath, "utf-8");
    const data = JSON.parse(raw);
    this.tasks = Array.isArray(data) ? data : data.tasks || [];
    this._validate();
  }

  save() {
    if (!this.tasksFilePath) {
      throw new Error("No tasks file path configured");
    }
    fs.writeFileSync(
      this.tasksFilePath,
      JSON.stringify({ tasks: this.tasks }, null, 2),
      "utf-8"
    );
  }

  _validate() {
    for (const task of this.tasks) {
      if (!task.name || typeof task.name !== "string") {
        throw new Error(`Invalid task: missing or invalid "name" field`);
      }
      if (!task.deadline) {
        throw new Error(`Invalid task "${task.name}": missing "deadline" field`);
      }
      const deadlineDate = new Date(task.deadline);
      if (isNaN(deadlineDate.getTime())) {
        throw new Error(`Invalid task "${task.name}": invalid deadline date "${task.deadline}"`);
      }
      if (task.progress !== undefined) {
        const p = Number(task.progress);
        if (isNaN(p) || p < 0 || p > 100) {
          throw new Error(`Invalid task "${task.name}": progress must be 0-100, got "${task.progress}"`);
        }
      }
    }
  }

  addTask({ name, deadline, progress = 0, created = null }) {
    if (!name || !deadline) {
      throw new Error("Task requires name and deadline");
    }
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      throw new Error(`Invalid deadline date: "${deadline}"`);
    }
    const existing = this.tasks.find((t) => t.name === name);
    if (existing) {
      throw new Error(`Task "${name}" already exists`);
    }
    const task = {
      name,
      deadline,
      progress: Math.max(0, Math.min(100, Number(progress))),
      created: created || new Date().toISOString(),
      completed: false,
    };
    this.tasks.push(task);
    return task;
  }

  completeTask(name) {
    const task = this.tasks.find((t) => t.name === name);
    if (!task) {
      throw new Error(`Task "${name}" not found`);
    }
    task.completed = true;
    task.progress = 100;
    task.completedAt = new Date().toISOString();
    return task;
  }

  updateProgress(name, progress) {
    const task = this.tasks.find((t) => t.name === name);
    if (!task) {
      throw new Error(`Task "${name}" not found`);
    }
    task.progress = Math.max(0, Math.min(100, Number(progress)));
    if (task.progress === 100) {
      task.completed = true;
      task.completedAt = new Date().toISOString();
    }
    return task;
  }

  _calculateRisk(task, now) {
    if (task.completed) return "none";

    const deadlineDate = new Date(task.deadline);
    const createdDate = new Date(task.created || now);
    const totalDuration = deadlineDate.getTime() - createdDate.getTime();
    const elapsed = now.getTime() - createdDate.getTime();
    const remaining = deadlineDate.getTime() - now.getTime();

    if (remaining <= 0) return "overdue";

    const timeProgress = totalDuration > 0 ? elapsed / totalDuration : 1;
    const taskProgress = (task.progress || 0) / 100;

    // Risk = how far behind schedule we are
    // If time used is much greater than progress made, risk is high
    const ratio = taskProgress > 0 ? timeProgress / taskProgress : timeProgress * 10;

    if (ratio >= 1 / RISK_THRESHOLDS.high) return "high";
    if (ratio >= 1 / RISK_THRESHOLDS.medium) return "medium";
    return "low";
  }

  _daysRemaining(task, now) {
    const deadlineDate = new Date(task.deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getTaskStatus(task, now = new Date()) {
    const risk = this._calculateRisk(task, now);
    const daysRemaining = this._daysRemaining(task, now);
    return {
      name: task.name,
      deadline: task.deadline,
      progress: task.progress || 0,
      completed: !!task.completed,
      risk,
      daysRemaining,
      onTrack: risk === "low" || risk === "none",
    };
  }

  getStatus(now = new Date()) {
    const taskStatuses = this.tasks.map((t) => this.getTaskStatus(t, now));
    const total = taskStatuses.length;
    const completed = taskStatuses.filter((t) => t.completed).length;
    const atRisk = taskStatuses.filter(
      (t) => t.risk === "high" || t.risk === "overdue"
    ).length;
    const overdue = taskStatuses.filter((t) => t.risk === "overdue").length;
    const avgProgress =
      total > 0
        ? Math.round(taskStatuses.reduce((s, t) => s + t.progress, 0) / total)
        : 0;

    return {
      summary: {
        total,
        completed,
        atRisk,
        overdue,
        avgProgress,
        allOnTrack: atRisk === 0 && overdue === 0,
      },
      tasks: taskStatuses,
      generatedAt: now.toISOString(),
    };
  }

  static getDemoTasks() {
    const now = new Date();
    const inDays = (d) => {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      return date.toISOString().split("T")[0];
    };
    const daysAgo = (d) => {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      return date.toISOString();
    };

    return [
      {
        name: "API Integration",
        deadline: inDays(10),
        progress: 75,
        created: daysAgo(20),
        completed: false,
      },
      {
        name: "Documentation Update",
        deadline: inDays(3),
        progress: 30,
        created: daysAgo(14),
        completed: false,
      },
      {
        name: "Unit Tests",
        deadline: inDays(7),
        progress: 90,
        created: daysAgo(10),
        completed: false,
      },
      {
        name: "Security Audit",
        deadline: inDays(-2),
        progress: 60,
        created: daysAgo(30),
        completed: false,
      },
      {
        name: "CI Pipeline Setup",
        deadline: inDays(14),
        progress: 100,
        created: daysAgo(7),
        completed: true,
      },
    ];
  }
}

module.exports = { Tracker, RISK_THRESHOLDS };
