import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import LangToggle from "@/components/lang-toggle";
import NavigationMenu from "@/components/navigation-menu";
import ToggleTheme from "@/components/toggle-theme";
import { Button } from "@/components/ui/button";
import {
  assignTaskToAgent,
  type BlockInstance,
  type BlockType,
  createBlock,
  createGitStaleTask,
  createInitialCanvasDemoState,
  createTerminalFailureTask,
  moveBlock,
  resizeBlock,
  resolveTaskApproval,
  type Task,
  updateViewport,
} from "@/features/canvas-os/demo-state";

const blockTypes: BlockType[] = ["terminal", "git", "notes", "agent_task"];

const statusClassMap: Record<Task["status"], string> = {
  proposed: "bg-muted text-muted-foreground",
  queued: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  running:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  blocked: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  needs_approval:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  done: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
  cancelled: "bg-muted text-muted-foreground",
};

const blockBodyMap: Record<BlockInstance["type"], string> = {
  terminal:
    "Terminal context provider: cwd, last command, recent output and error spans.",
  git: "Git context provider: branch, dirty state, stale detection and diff summary.",
  notes: "Markdown notes for linking tasks, repos and analysis outputs.",
  agent_task:
    "Agent task block for assignment, planning state and approval-gated action proposals.",
  analysis:
    "AI generated analysis block with context citations and proposed next actions.",
};

function HomePage() {
  const [state, setState] = useState(createInitialCanvasDemoState);
  const [focusedBlockId, setFocusedBlockId] = useState<string | undefined>();
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    state.tasks[0]?.id ?? ""
  );

  const selectedTask = useMemo(
    () => state.tasks.find((task) => task.id === selectedTaskId),
    [selectedTaskId, state.tasks]
  );

  const updateSelectedTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    const selected = state.tasks.find((task) => task.id === taskId);
    setFocusedBlockId(selected?.anchor.blockId);
  };

  return (
    <>
      <NavigationMenu />
      <div className="flex h-full flex-col gap-3">
        <header className="flex items-center justify-between rounded-md border bg-card p-3">
          <div>
            <h1 className="font-semibold text-xl">CanvasOS MVP Workspace</h1>
            <p className="text-muted-foreground text-xs">
              Agent-native infinite canvas shell prototype (Phase 1 MVP)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <LangToggle />
            <ToggleTheme />
          </div>
        </header>

        <div className="grid min-h-0 flex-1 grid-cols-12 gap-3">
          <section className="col-span-9 flex min-h-0 flex-col rounded-md border bg-card p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap gap-2">
                {blockTypes.map((type) => (
                  <Button
                    key={type}
                    onClick={() => setState((prev) => createBlock(prev, type))}
                    size="sm"
                    variant="outline"
                  >
                    Add {type}
                  </Button>
                ))}
                <Button
                  onClick={() =>
                    setState((prev) => createTerminalFailureTask(prev))
                  }
                  size="sm"
                  variant="secondary"
                >
                  Simulate terminal failure
                </Button>
                <Button
                  onClick={() => setState((prev) => createGitStaleTask(prev))}
                  size="sm"
                  variant="secondary"
                >
                  Simulate git stale
                </Button>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <Button
                  onClick={() =>
                    setState((prev) =>
                      updateViewport(prev, { x: prev.viewport.x - 40 })
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  Pan ←
                </Button>
                <Button
                  onClick={() =>
                    setState((prev) =>
                      updateViewport(prev, { x: prev.viewport.x + 40 })
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  Pan →
                </Button>
                <Button
                  onClick={() =>
                    setState((prev) =>
                      updateViewport(prev, { zoom: prev.viewport.zoom + 0.1 })
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  Zoom +
                </Button>
                <Button
                  onClick={() =>
                    setState((prev) =>
                      updateViewport(prev, { zoom: prev.viewport.zoom - 0.1 })
                    )
                  }
                  size="sm"
                  variant="outline"
                >
                  Zoom -
                </Button>
              </div>
            </div>

            <div className="mb-2 text-muted-foreground text-xs">
              viewport: x {state.viewport.x} / y {state.viewport.y} / zoom{" "}
              {state.viewport.zoom.toFixed(2)}
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-md border border-dashed bg-muted/20 p-2">
              <div className="relative h-[860px] w-[1320px] overflow-hidden rounded bg-background/80">
                <div
                  className="absolute inset-0"
                  style={{
                    transform: `translate(${state.viewport.x}px, ${state.viewport.y}px) scale(${state.viewport.zoom})`,
                    transformOrigin: "top left",
                  }}
                >
                  {state.blocks.map((block) => (
                    <article
                      className={`absolute rounded-md border bg-card p-2 text-xs shadow-sm ${
                        focusedBlockId === block.id
                          ? "ring-2 ring-purple-500"
                          : "ring-0"
                      }`}
                      key={block.id}
                      style={{
                        height: `${block.size.height}px`,
                        left: `${block.position.x}px`,
                        top: `${block.position.y}px`,
                        width: `${block.size.width}px`,
                      }}
                    >
                      <div className="mb-2 flex items-center justify-between gap-1">
                        <h2 className="font-medium">{block.title}</h2>
                        <div className="flex gap-1">
                          <Button
                            onClick={() =>
                              setState((prev) =>
                                moveBlock(prev, block.id, -20, 0)
                              )
                            }
                            size="icon-xs"
                            variant="outline"
                          >
                            ←
                          </Button>
                          <Button
                            onClick={() =>
                              setState((prev) =>
                                moveBlock(prev, block.id, 20, 0)
                              )
                            }
                            size="icon-xs"
                            variant="outline"
                          >
                            →
                          </Button>
                          <Button
                            onClick={() =>
                              setState((prev) =>
                                resizeBlock(prev, block.id, 24, 16)
                              )
                            }
                            size="icon-xs"
                            variant="outline"
                          >
                            ⤢
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        {blockBodyMap[block.type]}
                      </p>
                    </article>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <aside className="col-span-3 flex min-h-0 flex-col rounded-md border bg-card p-3">
            <h2 className="font-medium text-sm">Queue</h2>
            <p className="mb-2 text-muted-foreground text-xs">
              Click a task to jump to anchor and assign to agent.
            </p>

            <div className="min-h-0 flex-1 space-y-2 overflow-auto">
              {state.tasks.map((task) => (
                <button
                  className={`w-full rounded-md border p-2 text-left text-xs ${
                    selectedTaskId === task.id
                      ? "border-purple-500"
                      : "border-border"
                  }`}
                  key={task.id}
                  onClick={() => updateSelectedTask(task.id)}
                  type="button"
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="font-medium">{task.title}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 ${statusClassMap[task.status]}`}
                    >
                      {task.status}
                    </span>
                  </div>
                  <div className="text-muted-foreground">
                    anchor: {task.anchor.blockId ?? "workspace"}
                  </div>
                </button>
              ))}
            </div>

            {selectedTask ? (
              <div className="mt-3 space-y-2 rounded-md border bg-muted/30 p-2 text-xs">
                <p>
                  assignee: <strong>{selectedTask.assignee}</strong>
                </p>
                <p>
                  approval policy:{" "}
                  <strong>{selectedTask.approvalPolicy}</strong>
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() =>
                      setState((prev) =>
                        assignTaskToAgent(prev, selectedTask.id)
                      )
                    }
                    size="sm"
                  >
                    Assign to AI
                  </Button>
                  <Button
                    onClick={() =>
                      setState((prev) =>
                        resolveTaskApproval(prev, selectedTask.id, true)
                      )
                    }
                    size="sm"
                    variant="secondary"
                  >
                    Approve
                  </Button>
                  <Button
                    onClick={() =>
                      setState((prev) =>
                        resolveTaskApproval(prev, selectedTask.id, false)
                      )
                    }
                    size="sm"
                    variant="destructive"
                  >
                    Reject
                  </Button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
