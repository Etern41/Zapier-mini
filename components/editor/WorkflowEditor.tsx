"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Zap, Play, Clock, Settings } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { EditorTopBar } from "@/components/editor/EditorTopBar";
import { FlowFitView } from "@/components/editor/FlowFitView";
import { NodePicker } from "@/components/editor/NodePicker";
import type { PickerKey } from "@/lib/editor/node-meta";
import { NodeConfigPanel } from "@/components/editor/NodeConfigPanel";
import { TriggerNode } from "@/components/editor/nodes/TriggerNode";
import { ActionNode } from "@/components/editor/nodes/ActionNode";
import { ButtonEdge } from "@/components/editor/edges/ButtonEdge";
import { NODE_TYPE_MAP } from "@/lib/editor/node-meta";
import { buildNodeSummary, nodeStatus } from "@/lib/editor/summary";
import type { NodeType } from "@prisma/client";

type WfNode = {
  id: string;
  type: NodeType;
  label: string;
  config: unknown;
  positionX: number;
  positionY: number;
  order: number;
};

type WfEdge = {
  id: string;
  sourceId: string;
  targetId: string;
};

export type WorkflowPayload = {
  id: string;
  name: string;
  isActive: boolean;
  webhookSecret: string | null;
  nodes: WfNode[];
  edges: WfEdge[];
};

function chainOrder(nodes: WfNode[], edges: WfEdge[]): string[] {
  const trigger = nodes.find((n) => String(n.type).startsWith("TRIGGER"));
  if (!trigger) return nodes.map((n) => n.id).sort();
  const out: string[] = [];
  let cur: string | undefined = trigger.id;
  const seen = new Set<string>();
  while (cur && !seen.has(cur)) {
    seen.add(cur);
    out.push(cur);
    const next = edges.find((e) => e.sourceId === cur);
    cur = next?.targetId;
  }
  for (const n of nodes) {
    if (!seen.has(n.id)) out.push(n.id);
  }
  return out;
}

async function patchOrders(workflowId: string, nodes: WfNode[], edges: WfEdge[]) {
  const ids = chainOrder(nodes, edges);
  await Promise.all(
    ids.map((id, order) =>
      fetch(`/api/nodes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      })
    )
  );
  void workflowId;
}

const rail = [
  { id: "triggers" as const, Icon: Zap, label: "Триггеры" },
  { id: "actions" as const, Icon: Play, label: "Действия" },
  { id: "history" as const, Icon: Clock, label: "История" },
  { id: "settings" as const, Icon: Settings, label: "Настройки" },
];

export function WorkflowEditor({ initial }: { initial: WorkflowPayload }) {
  const [wf, setWf] = useState(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [between, setBetween] = useState<{
    sourceId: string;
    targetId: string;
  } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [railTab, setRailTab] = useState<(typeof rail)[number]["id"]>(
    "triggers"
  );
  const dragSave = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [fitNonce, setFitNonce] = useState(0);
  const didMountFit = useRef(false);

  const reload = useCallback(async () => {
    const r = await fetch(`/api/workflows/${wf.id}`);
    if (!r.ok) return;
    const d = (await r.json()) as { workflow: WorkflowPayload };
    setWf(d.workflow);
  }, [wf.id]);

  useEffect(() => {
    setWf(initial);
  }, [initial]);

  useEffect(() => {
    if (!didMountFit.current) {
      didMountFit.current = true;
      setFitNonce((n) => n + 1);
    }
  }, []);

  const hasTrigger = useMemo(
    () => wf.nodes.some((n) => String(n.type).startsWith("TRIGGER")),
    [wf.nodes]
  );

  const openPicker = useCallback(() => {
    setBetween(null);
    setPickerOpen(true);
  }, []);

  const openPickerBetween = useCallback((sourceId: string, targetId: string) => {
    setBetween({ sourceId, targetId });
    setPickerOpen(true);
  }, []);

  const handlePick = useCallback(
    async (key: PickerKey) => {
      const meta = NODE_TYPE_MAP[key];
      const sorted = [...wf.nodes].sort((a, b) => a.order - b.order);
      const maxY =
        sorted.length > 0
          ? Math.max(...sorted.map((n) => n.positionY))
          : -220;
      const pos = { x: 400, y: maxY + 220 };

      const res = await fetch(`/api/workflows/${wf.id}/nodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: meta.type,
          label: meta.label,
          positionX: pos.x,
          positionY: pos.y,
          order: sorted.length,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        node?: WfNode;
        error?: string;
      };
      if (!res.ok || !body.node) {
        toast.error(body.error ?? "Не удалось добавить шаг");
        return;
      }
      const newNode = body.node;

      if (between) {
        await fetch(`/api/workflows/${wf.id}/edges`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: between.sourceId,
            targetId: between.targetId,
          }),
        });
        await fetch(`/api/workflows/${wf.id}/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: between.sourceId,
            targetId: newNode.id,
          }),
        });
        await fetch(`/api/workflows/${wf.id}/edges`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourceId: newNode.id,
            targetId: between.targetId,
          }),
        });
      } else if (sorted.length > 0) {
        const chain = chainOrder(wf.nodes, wf.edges);
        const tail = chain[chain.length - 1];
        if (tail) {
          await fetch(`/api/workflows/${wf.id}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId: tail,
              targetId: newNode.id,
            }),
          });
        }
      }

      const r2 = await fetch(`/api/workflows/${wf.id}`);
      if (r2.ok) {
        const d = (await r2.json()) as { workflow: WorkflowPayload };
        await patchOrders(wf.id, d.workflow.nodes, d.workflow.edges);
        await reload();
      }
      setBetween(null);
      setSelectedId(newNode.id);
      setFitNonce((n) => n + 1);
      toast.success("Шаг добавлен");
    },
    [wf, between, reload]
  );

  const onDeleteNode = useCallback(
    async (id: string) => {
      if (!confirm("Удалить узел?")) return;
      const res = await fetch(`/api/nodes/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Не удалось удалить узел");
        return;
      }
      setSelectedId(null);
      await reload();
    },
    [reload]
  );

  const nodeTypes = useMemo(
    () => ({
      trigger: TriggerNode,
      action: ActionNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      button: ButtonEdge,
    }),
    []
  );

  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    const sorted = [...wf.nodes].sort((a, b) => a.order - b.order);
    let actionStep = 0;
    const rfNodes: Node[] = sorted.map((n, idx) => {
      const cfg = (n.config ?? {}) as Record<string, unknown>;
      const { summary, configured } = buildNodeSummary(n.type, cfg);
      const st = nodeStatus(configured, wf.isActive);
      const isTr = String(n.type).startsWith("TRIGGER");
      if (!isTr) actionStep += 1;
      const stepNumber = idx + 1;
      const y = idx * 200;
      const x = 400;
      return {
        id: n.id,
        type: isTr ? "trigger" : "action",
        position: { x: n.positionX || x, y: n.positionY || y },
        data: isTr
          ? {
              label: n.label,
              summary,
              configured,
              status: st,
              stepNumber,
              onSelect: () => setSelectedId(n.id),
              onDelete: () => void onDeleteNode(n.id),
            }
          : {
              label: n.label,
              stepLabel: `Действие · шаг ${actionStep}`,
              summary,
              configured,
              status: st,
              stepNumber,
              onSelect: () => setSelectedId(n.id),
              onDelete: () => void onDeleteNode(n.id),
            },
      };
    });

    const rfEdges: Edge[] = wf.edges.map((e) => ({
      id: e.id,
      source: e.sourceId,
      target: e.targetId,
      type: "button",
      animated: true,
      style: {
        stroke: "hsl(var(--brand-purple))",
        strokeWidth: 2,
      },
      data: {
        onAdd: () => openPickerBetween(e.sourceId, e.targetId),
      },
    }));

    return { nodes: rfNodes, edges: rfEdges };
  }, [wf, onDeleteNode, openPickerBetween]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges, setNodes, setEdges]);

  const onConnect = useCallback(
    async (c: Connection) => {
      if (!c.source || !c.target) return;
      setEdges((eds) => addEdge({ ...c, animated: true }, eds));
      const res = await fetch(`/api/workflows/${wf.id}/edges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: c.source, targetId: c.target }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(j.error ?? "Не удалось создать связь");
        await reload();
        return;
      }
      await reload();
    },
    [wf.id, reload, setEdges]
  );

  const onNodeDragStop = useCallback(
    (_: unknown, node: Node) => {
      if (dragSave.current) clearTimeout(dragSave.current);
      dragSave.current = setTimeout(() => {
        void fetch(`/api/nodes/${node.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionX: node.position.x,
            positionY: node.position.y,
          }),
        });
      }, 400);
    },
    []
  );

  const selectedNode = wf.nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <EditorTopBar
        workflowId={wf.id}
        name={wf.name}
        isActive={wf.isActive}
        onSaved={() => void reload()}
      />
      <div className="flex min-h-0 flex-1 flex-row overflow-hidden">
        <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-border bg-card py-3">
          {rail.map(({ id, Icon, label }) =>
            id === "history" ? (
              <Link
                key={id}
                href={`/workflows/${wf.id}/runs`}
                title={label}
                className={cn(
                  "flex size-9 items-center justify-center rounded-lg",
                  "text-muted-foreground hover:bg-muted"
                )}
              >
                <Icon className="size-4" />
              </Link>
            ) : (
              <Button
                key={id}
                type="button"
                variant="ghost"
                size="icon-sm"
                title={label}
                className={cn(
                  "size-9 rounded-lg",
                  railTab === id
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted"
                )}
                onClick={() => setRailTab(id)}
              >
                <Icon className="size-4" />
              </Button>
            )
          )}
        </div>
        <div className="relative min-h-0 flex-1 bg-canvas">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeDragStop={onNodeDragStop}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              className="h-full min-h-[400px]"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={24}
                size={0.5}
                color="#e5e7eb"
              />
              <Controls
                className="!bottom-3 !right-3 scale-90 opacity-60 hover:opacity-100 [&_button]:!h-7 [&_button]:!w-7 [&_button]:!border-border"
                showInteractive={false}
              />
              <FlowFitView nonce={fitNonce} />
            </ReactFlow>
          </ReactFlowProvider>
          {!hasTrigger ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <Button
                className="pointer-events-auto"
                onClick={() => openPicker()}
              >
                Добавить триггер
              </Button>
            </div>
          ) : (
            <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
              <Button variant="secondary" onClick={() => openPicker()}>
                + Добавить шаг
              </Button>
            </div>
          )}
          {railTab === "settings" ? (
            <div className="absolute left-14 top-2 z-10 max-w-sm rounded-lg border bg-card p-3 text-xs text-muted-foreground shadow-md">
              <p className="font-medium text-foreground">Workflow ID</p>
              <p className="mt-1 break-all font-mono">{wf.id}</p>
              {wf.webhookSecret ? (
                <p className="mt-2">
                  Webhook uses header{" "}
                  <span className="font-mono">X-Webhook-Secret</span>
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
        <NodeConfigPanel
          open={!!selectedNode}
          workflowId={wf.id}
          node={selectedNode}
          onClose={() => setSelectedId(null)}
          onSaved={() => void reload()}
        />
      </div>
      <NodePicker
        open={pickerOpen}
        onOpenChange={(o) => {
          setPickerOpen(o);
          if (!o) setBetween(null);
        }}
        hasTrigger={hasTrigger}
        onPick={(k) => void handlePick(k)}
      />
    </div>
  );
}
