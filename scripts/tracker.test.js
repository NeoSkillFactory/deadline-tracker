const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { Tracker } = require("./tracker");
const { Reporter } = require("./reporter");

describe("Tracker", () => {
  it("should create a tracker with no tasks", () => {
    const tracker = new Tracker();
    assert.equal(tracker.tasks.length, 0);
  });

  it("should add a task", () => {
    const tracker = new Tracker();
    const task = tracker.addTask({
      name: "Test Task",
      deadline: "2026-04-01",
    });
    assert.equal(task.name, "Test Task");
    assert.equal(task.deadline, "2026-04-01");
    assert.equal(task.progress, 0);
    assert.equal(task.completed, false);
    assert.equal(tracker.tasks.length, 1);
  });

  it("should reject duplicate task names", () => {
    const tracker = new Tracker();
    tracker.addTask({ name: "Task A", deadline: "2026-04-01" });
    assert.throws(() => {
      tracker.addTask({ name: "Task A", deadline: "2026-05-01" });
    }, /already exists/);
  });

  it("should reject task with missing name", () => {
    const tracker = new Tracker();
    assert.throws(() => {
      tracker.addTask({ deadline: "2026-04-01" });
    }, /requires name/);
  });

  it("should reject task with invalid deadline", () => {
    const tracker = new Tracker();
    assert.throws(() => {
      tracker.addTask({ name: "Bad Date", deadline: "not-a-date" });
    }, /Invalid deadline/);
  });

  it("should complete a task", () => {
    const tracker = new Tracker();
    tracker.addTask({ name: "Task A", deadline: "2026-04-01", progress: 50 });
    const task = tracker.completeTask("Task A");
    assert.equal(task.completed, true);
    assert.equal(task.progress, 100);
    assert.ok(task.completedAt);
  });

  it("should throw on completing non-existent task", () => {
    const tracker = new Tracker();
    assert.throws(() => {
      tracker.completeTask("Ghost");
    }, /not found/);
  });

  it("should update progress", () => {
    const tracker = new Tracker();
    tracker.addTask({ name: "Task A", deadline: "2026-04-01" });
    const task = tracker.updateProgress("Task A", 75);
    assert.equal(task.progress, 75);
  });

  it("should clamp progress to 0-100", () => {
    const tracker = new Tracker();
    tracker.addTask({ name: "Task A", deadline: "2026-04-01" });
    tracker.updateProgress("Task A", 150);
    assert.equal(tracker.tasks[0].progress, 100);
    tracker.updateProgress("Task A", -10);
    assert.equal(tracker.tasks[0].progress, 0);
  });

  it("should auto-complete when progress reaches 100", () => {
    const tracker = new Tracker();
    tracker.addTask({ name: "Task A", deadline: "2026-04-01" });
    tracker.updateProgress("Task A", 100);
    assert.equal(tracker.tasks[0].completed, true);
  });

  it("should calculate risk correctly for overdue task", () => {
    const tracker = new Tracker();
    tracker.addTask({
      name: "Late",
      deadline: "2026-01-01",
      progress: 50,
      created: "2025-12-01T00:00:00Z",
    });
    const now = new Date("2026-02-27T00:00:00Z");
    const status = tracker.getTaskStatus(tracker.tasks[0], now);
    assert.equal(status.risk, "overdue");
    assert.ok(status.daysRemaining < 0);
  });

  it("should calculate risk as none for completed task", () => {
    const tracker = new Tracker();
    tracker.addTask({ name: "Done", deadline: "2026-01-01" });
    tracker.completeTask("Done");
    const now = new Date("2026-02-27T00:00:00Z");
    const status = tracker.getTaskStatus(tracker.tasks[0], now);
    assert.equal(status.risk, "none");
  });

  it("should calculate low risk for on-track task", () => {
    const tracker = new Tracker();
    tracker.tasks.push({
      name: "Ahead",
      deadline: "2026-04-01",
      progress: 80,
      created: "2026-02-01T00:00:00Z",
      completed: false,
    });
    const now = new Date("2026-02-27T00:00:00Z");
    const status = tracker.getTaskStatus(tracker.tasks[0], now);
    assert.equal(status.risk, "low");
    assert.equal(status.onTrack, true);
  });

  it("should generate overall status", () => {
    const tracker = new Tracker();
    tracker.tasks = Tracker.getDemoTasks();
    const status = tracker.getStatus();
    assert.ok(status.summary);
    assert.ok(status.tasks);
    assert.equal(status.summary.total, 5);
    assert.equal(status.summary.completed, 1);
    assert.ok(status.generatedAt);
  });

  it("should save and load from file", () => {
    const tmpFile = path.join(os.tmpdir(), `tracker-test-${Date.now()}.json`);
    try {
      const tracker = new Tracker(tmpFile);
      tracker.addTask({ name: "Persisted", deadline: "2026-05-01", progress: 42 });
      tracker.save();

      const loaded = new Tracker(tmpFile);
      assert.equal(loaded.tasks.length, 1);
      assert.equal(loaded.tasks[0].name, "Persisted");
      assert.equal(loaded.tasks[0].progress, 42);
    } finally {
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
    }
  });

  it("should load demo tasks", () => {
    const demo = Tracker.getDemoTasks();
    assert.equal(demo.length, 5);
    assert.ok(demo.every((t) => t.name && t.deadline !== undefined));
  });
});

describe("Reporter", () => {
  it("should generate text report", () => {
    const tracker = new Tracker();
    tracker.tasks = Tracker.getDemoTasks();
    const status = tracker.getStatus();
    const text = Reporter.generateText(status, { color: false });
    assert.ok(text.includes("Deadline Tracker Report"));
    assert.ok(text.includes("Summary"));
    assert.ok(text.includes("Tasks"));
    assert.ok(text.includes("API Integration"));
  });

  it("should generate markdown report", () => {
    const tracker = new Tracker();
    tracker.tasks = Tracker.getDemoTasks();
    const status = tracker.getStatus();
    const md = Reporter.generateMarkdown(status);
    assert.ok(md.includes("# Deadline Tracker Report"));
    assert.ok(md.includes("## Summary"));
    assert.ok(md.includes("## Tasks"));
    assert.ok(md.includes("| Metric | Value |"));
  });

  it("should generate valid JSON report", () => {
    const tracker = new Tracker();
    tracker.tasks = Tracker.getDemoTasks();
    const status = tracker.getStatus();
    const json = Reporter.generateJSON(status);
    const parsed = JSON.parse(json);
    assert.equal(parsed.summary.total, 5);
    assert.equal(parsed.tasks.length, 5);
  });

  it("should create progress bar", () => {
    const bar0 = Reporter._progressBar(0, 10);
    assert.equal(bar0, "[----------]");
    const bar50 = Reporter._progressBar(50, 10);
    assert.equal(bar50, "[#####-----]");
    const bar100 = Reporter._progressBar(100, 10);
    assert.equal(bar100, "[##########]");
  });
});
