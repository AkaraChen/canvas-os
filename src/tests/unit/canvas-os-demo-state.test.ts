import { describe, expect, test } from "vitest";
import {
  assignTaskToAgent,
  createInitialCanvasDemoState,
  createTerminalFailureTask,
  resolveTaskApproval,
  updateViewport,
} from "@/features/canvas-os/demo-state";

describe("CanvasOS demo state", () => {
  test("creates a terminal failure task with expected context", () => {
    const state = createTerminalFailureTask(createInitialCanvasDemoState());

    const task = state.tasks[0];

    expect(task.title).toBe("Investigate failing test");
    expect(task.contextRefs).toContain("terminal.recent_output");
    expect(task.status).toBe("queued");
  });

  test("assigning a task to agent produces approval state and analysis block", () => {
    const initial = createInitialCanvasDemoState();
    const next = assignTaskToAgent(initial, "task-review-diff");

    const task = next.tasks.find((item) => item.id === "task-review-diff");
    const analysisBlock = next.blocks.find(
      (block) => block.type === "analysis"
    );

    expect(task?.assignee).toBe("agent");
    expect(task?.status).toBe("needs_approval");
    expect(analysisBlock).toBeDefined();
    expect(next.agentRuns[0]?.taskId).toBe("task-review-diff");
  });

  test("approval resolution updates task and agent run status", () => {
    const assigned = assignTaskToAgent(
      createInitialCanvasDemoState(),
      "task-review-diff"
    );
    const approved = resolveTaskApproval(assigned, "task-review-diff", true);

    expect(
      approved.tasks.find((task) => task.id === "task-review-diff")?.status
    ).toBe("done");
    expect(approved.agentRuns[0]?.status).toBe("completed");
  });

  test("viewport zoom is clamped", () => {
    const state = createInitialCanvasDemoState();

    expect(updateViewport(state, { zoom: 10 }).viewport.zoom).toBe(2);
    expect(updateViewport(state, { zoom: 0.1 }).viewport.zoom).toBe(0.5);
  });
});
