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
import {
  chainOrder,
  reindexNodeOrders,
  patchOrderDiffs,
} from "@/lib/editor/graph-order";
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

const rail = [
  { id: "triggers" as const, Icon: Zap, label: "Триггеры" },
  { id: "actions" as const, Icon: Play, label: "Действия" },
  { id: "history" as const, Icon: Clock, label: "История" },
  { id: "settings" as const, Icon: Settings, label: "Настройки" },
];

export function WorkflowEditor({
  initial,
  userName,
  userEmail,
}: {
  initial: WorkflowPayload;
  userName: string;
  userEmail?: string | null;
}) {
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

  const focusFirstTrigger = useCallback(() => {
    setRailTab("triggers");
    const trig = wf.nodes.find((n) => String(n.type).startsWith("TRIGGER"));
    if (trig) setSelectedId(trig.id);
  }, [wf.nodes]);

  const focusFirstAction = useCallback(() => {
    setRailTab("actions");
    const ids = chainOrder(wf.nodes, wf.edges);
    const firstActionId = ids.find((id) => {
      const n = wf.nodes.find((x) => x.id === id);
      return n && !String(n.type).startsWith("TRIGGER");
    });
    if (firstActionId) setSelectedId(firstActionId);
  }, [wf.nodes, wf.edges]);

  const handlePick = useCallback(
    async (key: PickerKey) => {
      const meta = NODE_TYPE_MAP[key];
      const sorted = [...wf.nodes].sort((a, b) => a.order - b.order);
      const maxY =
        sorted.length > 0
          ? Math.max(...sorted.map((n) => n.positionY))
          : -220;
      let pos = { x: 120, y: maxY + 220 };
      if (between) {
        const src = wf.nodes.find((n) => n.id === between.sourceId);
        const tgt = wf.nodes.find((n) => n.id === between.targetId);
        if (src && tgt) {
          pos = {
            x: Math.round((src.positionX + tgt.positionX) / 2),
            y: Math.round((src.positionY + tgt.positionY) / 2),
          };
        }
      }

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

      let nextEdges = [...wf.edges];
      try {
        if (between) {
          const delRes = await fetch(`/api/workflows/${wf.id}/edges`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId: between.sourceId,
              targetId: between.targetId,
            }),
          });
          const delBody = (await delRes.json().catch(() => ({}))) as {
            error?: string;
          };
          if (!delRes.ok) {
            throw new Error(delBody.error ?? "Не удалось удалить связь");
          }
          nextEdges = nextEdges.filter(
            (e) =>
              !(
                e.sourceId === between.sourceId &&
                e.targetId === between.targetId
              )
          );
          const e1Res = await fetch(`/api/workflows/${wf.id}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId: between.sourceId,
              targetId: newNode.id,
            }),
          });
          const e1Body = (await e1Res.json().catch(() => ({}))) as {
            edge?: WfEdge;
            error?: string;
          };
          if (!e1Res.ok || !e1Body.edge) {
            throw new Error(e1Body.error ?? "Не удалось создать связь");
          }
          nextEdges.push(e1Body.edge);
          const e2Res = await fetch(`/api/workflows/${wf.id}/edges`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId: newNode.id,
              targetId: between.targetId,
            }),
          });
          const e2Body = (await e2Res.json().catch(() => ({}))) as {
            edge?: WfEdge;
            error?: string;
          };
          if (!e2Res.ok || !e2Body.edge) {
            throw new Error(e2Body.error ?? "Не удалось создать связь");
          }
          nextEdges.push(e2Body.edge);
        } else if (sorted.length > 0) {
          const chain = chainOrder(wf.nodes, wf.edges);
          const tail = chain[chain.length - 1];
          if (tail) {
            const eRes = await fetch(`/api/workflows/${wf.id}/edges`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sourceId: tail,
                targetId: newNode.id,
              }),
            });
            const eBody = (await eRes.json().catch(() => ({}))) as {
              edge?: WfEdge;
              error?: string;
            };
            if (!eRes.ok || !eBody.edge) {
              throw new Error(eBody.error ?? "Не удалось создать связь");
            }
            nextEdges.push(eBody.edge);
          }
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Ошибка связей");
        await reload();
        setBetween(null);
        return;
      }

      const nextNodes = [...wf.nodes, newNode];
      const afterOrders = reindexNodeOrders(nextNodes, nextEdges);
      let webhookSecret = wf.webhookSecret;
      if (String(meta.type).startsWith("TRIGGER_WEBHOOK") && !webhookSecret) {
        const wr = await fetch(`/api/workflows/${wf.id}`);
        if (wr.ok) {
          const d = (await wr.json()) as { workflow: WorkflowPayload };
          webhookSecret = d.workflow.webhookSecret;
        }
      }

      try {
        await patchOrderDiffs(wf.nodes, afterOrders);
      } catch {
        toast.error("Не удалось обновить порядок шагов");
        await reload();
        setBetween(null);
        return;
      }

      setWf((prev) => ({
        ...prev,
        nodes: afterOrders,
        edges: nextEdges,
        webhookSecret: webhookSecret ?? prev.webhookSecret,
      }));
      setBetween(null);
      setPickerOpen(false);
      setSelectedId(newNode.id);
      toast.success("Шаг добавлен");
    },
    [wf, between, reload]
  );

  const removeNodesByIds = useCallback(
    async (ids: string[], opts?: { optimistic?: boolean }) => {
      if (ids.length === 0) return;
      const optimistic = opts?.optimistic ?? false;
      const idSet = new Set(ids);
      const prevWf = wf;
      const nextNodes = prevWf.nodes.filter((n) => !idSet.has(n.id));
      const nextEdges = prevWf.edges.filter(
        (e) => !idSet.has(e.sourceId) && !idSet.has(e.targetId)
      );
      const afterOrders = reindexNodeOrders(nextNodes, nextEdges);

      if (optimistic) {
        setWf({ ...prevWf, nodes: afterOrders, edges: nextEdges });
        setSelectedId((sid) => (sid && idSet.has(sid) ? null : sid));
      }

      const results = await Promise.all(
        ids.map((id) => fetch(`/api/nodes/${id}`, { method: "DELETE" }))
      );
      const failRes = results.find((r) => !r.ok);
      if (failRes) {
        const j = (await failRes.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(j.error ?? "Не удалось удалить узел");
        if (optimistic) setWf(prevWf);
        await reload();
        return;
      }

      try {
        await patchOrderDiffs(prevWf.nodes, afterOrders);
      } catch {
        toast.error("Не удалось синхронизировать порядок");
        if (optimistic) setWf(prevWf);
        await reload();
        return;
      }

      if (!optimistic) {
        setWf({ ...prevWf, nodes: afterOrders, edges: nextEdges });
        setSelectedId((sid) => (sid && idSet.has(sid) ? null : sid));
      }
    },
    [wf, reload]
  );

  const onDeleteNode = useCallback(
    (id: string) => {
      if (!confirm("Удалить узел?")) return;
      void removeNodesByIds([id], { optimistic: true });
    },
    [removeNodesByIds]
  );

  const onBeforeDelete = useCallback(
    async ({
      nodes: nodesToRemove,
      edges: edgesToRemove,
    }: {
      nodes: Node[];
      edges: Edge[];
    }) => nodesToRemove.length > 0 || edgesToRemove.length > 0,
    []
  );

  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      const ids = deleted.map((n) => n.id);
      void removeNodesByIds(ids, { optimistic: true });
    },
    [removeNodesByIds]
  );

  const onEdgesDelete = useCallback(
    (deleted: Edge[]) => {
      if (deleted.length === 0) return;
      const prevWf = wf;
      const key = (s: string, t: string) => `${s}:${t}`;
      const delSet = new Set(deleted.map((e) => key(e.source, e.target)));
      const nextEdges = prevWf.edges.filter(
        (e) => !delSet.has(key(e.sourceId, e.targetId))
      );
      const nextNodes = reindexNodeOrders(prevWf.nodes, nextEdges);

      setWf({ ...prevWf, edges: nextEdges, nodes: nextNodes });

      void (async () => {
        for (const e of deleted) {
          const res = await fetch(`/api/workflows/${wf.id}/edges`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sourceId: e.source,
              targetId: e.target,
            }),
          });
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          if (!res.ok) {
            toast.error(j.error ?? "Не удалось удалить связь");
            setWf(prevWf);
            await reload();
            return;
          }
        }
        try {
          await patchOrderDiffs(prevWf.nodes, nextNodes);
        } catch {
          toast.error("Не удалось обновить порядок шагов");
          await reload();
        }
      })();
    },
    [wf, reload]
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
      const defaultX = 120;
      const px = n.positionX != null ? n.positionX : defaultX;
      const py = n.positionY != null ? n.positionY : y;
      return {
        id: n.id,
        type: isTr ? "trigger" : "action",
        position: { x: px, y: py },
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
      selectable: true,
      focusable: true,
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
      const res = await fetch(`/api/workflows/${wf.id}/edges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceId: c.source, targetId: c.target }),
      });
      const body = (await res.json().catch(() => ({}))) as {
        edge?: WfEdge;
        error?: string;
      };
      if (!res.ok || !body.edge) {
        toast.error(body.error ?? "Не удалось создать связь");
        return;
      }
      const nextEdges = [...wf.edges, body.edge];
      const nextNodes = reindexNodeOrders(wf.nodes, nextEdges);
      try {
        await patchOrderDiffs(wf.nodes, nextNodes);
      } catch {
        toast.error("Не удалось обновить порядок шагов");
        await reload();
        return;
      }
      setWf((prev) => ({
        ...prev,
        edges: nextEdges,
        nodes: nextNodes,
      }));
    },
    [wf.id, wf.edges, wf.nodes, reload]
  );

  const onNodeDragStop = useCallback((_: unknown, node: Node) => {
    if (dragSave.current) clearTimeout(dragSave.current);
    dragSave.current = setTimeout(() => {
      void (async () => {
        const res = await fetch(`/api/nodes/${node.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            positionX: node.position.x,
            positionY: node.position.y,
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { error?: string };
          toast.error(j.error ?? "Не удалось сохранить позицию");
        }
      })();
    }, 400);
  }, []);

  const selectedNode = wf.nodes.find((n) => n.id === selectedId) ?? null;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <EditorTopBar
        workflowId={wf.id}
        name={wf.name}
        isActive={wf.isActive}
        userName={userName}
        userEmail={userEmail}
        onSaved={() => void reload()}
      />
      <div className="relative flex min-h-0 flex-1 flex-row overflow-hidden">
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
                onClick={() => {
                  if (id === "triggers") focusFirstTrigger();
                  else if (id === "actions") focusFirstAction();
                  else setRailTab(id);
                }}
              >
                <Icon className="size-4" />
              </Button>
            )
          )}
        </div>
        <div className="relative flex min-h-0 flex-1 flex-col bg-canvas">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <ReactFlowProvider>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeDragStop={onNodeDragStop}
                onBeforeDelete={onBeforeDelete}
                onNodesDelete={onNodesDelete}
                onEdgesDelete={onEdgesDelete}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                nodesConnectable
                edgesFocusable
                connectOnClick
                deleteKeyCode={["Backspace", "Delete"]}
                defaultEdgeOptions={{
                  interactionWidth: 32,
                  selectable: true,
                  focusable: true,
                }}
                className="h-full min-h-[min(50vh,360px)] md:min-h-[400px]"
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={24}
                  size={0.5}
                  color="#e5e7eb"
                />
                <Controls
                  position="bottom-right"
                  className="max-sm:!bottom-14 scale-90 opacity-60 hover:opacity-100 [&_button]:!h-7 [&_button]:!w-7 [&_button]:!border-border"
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
            ) : null}
            {railTab === "settings" ? (
              <div className="absolute left-2 right-2 top-2 z-10 max-h-[min(50vh,320px)] overflow-y-auto rounded-lg border bg-card p-3 text-xs text-muted-foreground shadow-md sm:left-14 sm:right-auto sm:max-w-sm">
                <p className="font-medium text-foreground">ID воркфлоу</p>
                <p className="mt-1 break-all font-mono">{wf.id}</p>
                {wf.webhookSecret ? (
                  <p className="mt-2">
                    Для входящих webhook-запросов передайте заголовок{" "}
                    <span className="font-mono">X-Webhook-Secret</span> со
                    значением секрета из настроек триггера Webhook.
                  </p>
                ) : (
                  <p className="mt-2">
                    После добавления триггера Webhook здесь появится подсказка по
                    секрету и заголовку{" "}
                    <span className="font-mono">X-Webhook-Secret</span>.
                  </p>
                )}
              </div>
            ) : null}
            {hasTrigger ? (
              <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3 sm:bottom-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="pointer-events-auto border-border bg-card/95 shadow-md backdrop-blur-sm"
                  onClick={() => openPicker()}
                >
                  + Добавить шаг
                </Button>
              </div>
            ) : null}
          </div>
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
