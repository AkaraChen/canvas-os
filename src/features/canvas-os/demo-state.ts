export type BlockType =
  | "terminal"
  | "git"
  | "notes"
  | "agent_task"
  | "analysis";

export type TaskStatus =
  | "proposed"
  | "queued"
  | "running"
  | "blocked"
  | "needs_approval"
  | "done"
  | "failed"
  | "cancelled";

export interface BlockInstance {
  id: string;
  position: { x: number; y: number };
  settings: Record<string, unknown>;
  size: { width: number; height: number };
  title: string;
  type: BlockType;
}

export interface Task {
  anchor: { blockId?: string };
  approvalPolicy:
    | "none"
    | "confirm_before_write"
    | "confirm_before_external_side_effect";
  assignee: "user" | "agent" | "both";
  contextRefs: string[];
  id: string;
  priority: "low" | "normal" | "high";
  status: TaskStatus;
  title: string;
}

export interface AgentRun {
  contextUsed: string[];
  id: string;
  status: "planning" | "running" | "waiting_user" | "completed" | "failed";
  summary: string;
  taskId: string;
}

export interface CanvasDemoState {
  agentRuns: AgentRun[];
  blocks: BlockInstance[];
  nextId: number;
  tasks: Task[];
  viewport: { x: number; y: number; zoom: number };
}

const blockTemplates: Record<
  BlockType,
  Omit<BlockInstance, "id" | "position">
> = {
  terminal: {
    type: "terminal",
    title: "Terminal Block",
    size: { width: 320, height: 200 },
    settings: { cwd: "/workspace/repo" },
  },
  git: {
    type: "git",
    title: "Git Block",
    size: { width: 340, height: 220 },
    settings: { staleThresholdMinutes: 90 },
  },
  notes: {
    type: "notes",
    title: "Notes Block",
    size: { width: 300, height: 220 },
    settings: {},
  },
  agent_task: {
    type: "agent_task",
    title: "Agent Task Block",
    size: { width: 300, height: 190 },
    settings: {},
  },
  analysis: {
    type: "analysis",
    title: "Analysis Block",
    size: { width: 360, height: 220 },
    settings: {},
  },
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const createId = (prefix: string, nextId: number): string =>
  `${prefix}-${nextId}`;

export function createInitialCanvasDemoState(): CanvasDemoState {
  return {
    viewport: { x: 0, y: 0, zoom: 1 },
    nextId: 1,
    blocks: [
      {
        id: "block-terminal",
        ...blockTemplates.terminal,
        position: { x: 40, y: 48 },
      },
      {
        id: "block-git",
        ...blockTemplates.git,
        position: { x: 400, y: 48 },
      },
      {
        id: "block-notes",
        ...blockTemplates.notes,
        position: { x: 40, y: 300 },
      },
      {
        id: "block-agent-task",
        ...blockTemplates.agent_task,
        position: { x: 380, y: 300 },
      },
    ],
    tasks: [
      {
        id: "task-review-diff",
        title: "Review current diff",
        assignee: "user",
        status: "queued",
        priority: "normal",
        anchor: { blockId: "block-git" },
        contextRefs: ["git.diff_summary", "git.changed_files"],
        approvalPolicy: "confirm_before_write",
      },
    ],
    agentRuns: [],
  };
}

export function createBlock(
  state: CanvasDemoState,
  type: BlockType
): CanvasDemoState {
  const id = createId("block", state.nextId);
  const template = blockTemplates[type];
  const indexOffset = state.blocks.length * 24;

  return {
    ...state,
    nextId: state.nextId + 1,
    blocks: [
      ...state.blocks,
      {
        id,
        ...template,
        position: { x: 80 + indexOffset, y: 80 + indexOffset },
      },
    ],
  };
}

export function updateViewport(
  state: CanvasDemoState,
  options: Partial<CanvasDemoState["viewport"]>
): CanvasDemoState {
  const nextZoom = options.zoom ?? state.viewport.zoom;
  return {
    ...state,
    viewport: {
      x: options.x ?? state.viewport.x,
      y: options.y ?? state.viewport.y,
      zoom: clamp(nextZoom, 0.5, 2),
    },
  };
}

export function moveBlock(
  state: CanvasDemoState,
  blockId: string,
  dx: number,
  dy: number
): CanvasDemoState {
  return {
    ...state,
    blocks: state.blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            position: {
              x: block.position.x + dx,
              y: block.position.y + dy,
            },
          }
        : block
    ),
  };
}

export function resizeBlock(
  state: CanvasDemoState,
  blockId: string,
  deltaWidth: number,
  deltaHeight: number
): CanvasDemoState {
  return {
    ...state,
    blocks: state.blocks.map((block) =>
      block.id === blockId
        ? {
            ...block,
            size: {
              width: clamp(block.size.width + deltaWidth, 220, 640),
              height: clamp(block.size.height + deltaHeight, 160, 420),
            },
          }
        : block
    ),
  };
}

export function createTerminalFailureTask(
  state: CanvasDemoState
): CanvasDemoState {
  const taskId = createId("task", state.nextId);

  return {
    ...state,
    nextId: state.nextId + 1,
    tasks: [
      {
        id: taskId,
        title: "Investigate failing test",
        assignee: "user",
        status: "queued",
        priority: "high",
        anchor: { blockId: "block-terminal" },
        contextRefs: [
          "terminal.last_command",
          "terminal.recent_output",
          "git.diff_summary",
        ],
        approvalPolicy: "confirm_before_write",
      },
      ...state.tasks,
    ],
  };
}

export function createGitStaleTask(state: CanvasDemoState): CanvasDemoState {
  const taskId = createId("task", state.nextId);

  return {
    ...state,
    nextId: state.nextId + 1,
    tasks: [
      {
        id: taskId,
        title: "Branch is behind remote",
        assignee: "user",
        status: "queued",
        priority: "normal",
        anchor: { blockId: "block-git" },
        contextRefs: ["git.status", "git.branch_behind"],
        approvalPolicy: "confirm_before_external_side_effect",
      },
      ...state.tasks,
    ],
  };
}

export function assignTaskToAgent(
  state: CanvasDemoState,
  taskId: string
): CanvasDemoState {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) {
    return state;
  }

  const runId = createId("run", state.nextId);
  const analysisBlockId = createId("block", state.nextId + 1);

  return {
    ...state,
    nextId: state.nextId + 2,
    tasks: state.tasks.map((item) =>
      item.id === taskId
        ? {
            ...item,
            assignee: "agent",
            status: "needs_approval",
          }
        : item
    ),
    agentRuns: [
      {
        id: runId,
        taskId,
        status: "waiting_user",
        summary:
          "Agent read git diff, terminal output, and nearby notes to draft an action proposal.",
        contextUsed: task.contextRefs,
      },
      ...state.agentRuns,
    ],
    blocks: [
      ...state.blocks,
      {
        id: analysisBlockId,
        ...blockTemplates.analysis,
        position: { x: 760, y: 140 },
        settings: {
          markdown:
            "### Analysis\n- Root cause identified from terminal failure\n- Suggested patch is ready and waiting for approval",
          sourceTaskId: taskId,
        },
      },
    ],
  };
}

export function resolveTaskApproval(
  state: CanvasDemoState,
  taskId: string,
  approved: boolean
): CanvasDemoState {
  return {
    ...state,
    tasks: state.tasks.map((task) =>
      task.id === taskId
        ? {
            ...task,
            status: approved ? "done" : "blocked",
          }
        : task
    ),
    agentRuns: state.agentRuns.map((run) =>
      run.taskId === taskId && run.status === "waiting_user"
        ? {
            ...run,
            status: approved ? "completed" : "failed",
            summary: approved
              ? "User approved the proposal and the task is now done."
              : "User rejected the proposal and the task is blocked for follow-up.",
          }
        : run
    ),
  };
}
