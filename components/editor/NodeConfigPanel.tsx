"use client";

import { useState } from "react";
import { X, Zap, Play, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { NodeType } from "@prisma/client";
import { WebhookConfig } from "@/components/editor/config/WebhookConfig";
import { ScheduleConfig } from "@/components/editor/config/ScheduleConfig";
import { EmailTriggerConfig } from "@/components/editor/config/EmailTriggerConfig";
import { HttpActionConfig } from "@/components/editor/config/HttpActionConfig";
import { EmailActionConfig } from "@/components/editor/config/EmailActionConfig";
import { TelegramConfig } from "@/components/editor/config/TelegramConfig";
import { DbActionConfig } from "@/components/editor/config/DbActionConfig";
import { TransformConfig } from "@/components/editor/config/TransformConfig";

type NodeRow = {
  id: string;
  type: NodeType;
  label: string;
  config: unknown;
};

export function NodeConfigPanel({
  open,
  workflowId,
  node,
  onClose,
  onSaved,
}: {
  open: boolean;
  workflowId: string;
  workflowActive?: boolean;
  node: NodeRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [tab, setTab] = useState("config");
  const [testLoading, setTestLoading] = useState(false);
  const [testOut, setTestOut] = useState<unknown>(null);
  const [testOk, setTestOk] = useState<boolean | null>(null);

  const runTest = async () => {
    if (!node) return;
    setTestLoading(true);
    setTestOut(null);
    setTestOk(null);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodeId: node.id, testMode: true }),
      });
      const j = (await res.json()) as {
        error?: string;
        success?: boolean;
        run?: unknown;
      };
      if (!res.ok) {
        toast.error(j.error ?? "Ошибка тестового запуска");
      }
      setTestOk(res.ok && j.success !== false);
      setTestOut(j.run ?? j);
    } catch {
      setTestOk(false);
      setTestOut({ error: "Request failed" });
    } finally {
      setTestLoading(false);
    }
  };

  if (!open || !node) return null;

  const isTr = String(node.type).startsWith("TRIGGER");
  const Icon = isTr ? Zap : Play;
  const iconClass = isTr ? "text-violet-500" : "text-blue-500";

  return (
    <div
      className={cn(
        "absolute right-0 top-0 z-20 flex h-full w-96 flex-col border-l border-border bg-card shadow-lg transition-transform duration-200",
        open ? "translate-x-0" : "translate-x-full"
      )}
    >
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <Icon className={cn("size-5 shrink-0", iconClass)} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {node.label}
          </span>
          <TabsList className="h-8 shrink-0">
            <TabsTrigger value="config" className="text-xs">
              Настройка
            </TabsTrigger>
            <TabsTrigger value="test" className="text-xs">
              Тест
            </TabsTrigger>
          </TabsList>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto size-8 shrink-0"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </Button>
        </div>

        <TabsContent
          value="config"
          className="mt-0 min-h-0 flex-1 overflow-y-auto p-4 outline-none"
        >
          {node.type === "TRIGGER_WEBHOOK" ? (
            <WebhookConfig
              workflowId={workflowId}
              nodeId={node.id}
              initial={node.config}
              onSaved={onSaved}
            />
          ) : null}
          {node.type === "TRIGGER_SCHEDULE" ? (
            <ScheduleConfig
              workflowId={workflowId}
              nodeId={node.id}
              initial={node.config}
              onSaved={onSaved}
            />
          ) : null}
          {node.type === "TRIGGER_EMAIL" ? (
            <EmailTriggerConfig
              nodeId={node.id}
              initial={node.config}
              onSaved={onSaved}
            />
          ) : null}
          {node.type === "ACTION_HTTP" ? (
            <HttpActionConfig
              nodeId={node.id}
              initial={node.config}
              onSaved={onSaved}
            />
          ) : null}
          {node.type === "ACTION_EMAIL" ? (
            <EmailActionConfig
              nodeId={node.id}
              initial={node.config}
              onSaved={onSaved}
            />
          ) : null}
          {node.type === "ACTION_TELEGRAM" ? (
            <TelegramConfig
              nodeId={node.id}
              initial={node.config}
              onSaved={onSaved}
            />
          ) : null}
          {node.type === "ACTION_DB" ? (
            <DbActionConfig
              nodeId={node.id}
              initial={node.config}
              onSaved={onSaved}
            />
          ) : null}
          {node.type === "ACTION_TRANSFORM" ? (
            <TransformConfig
              nodeId={node.id}
              initial={node.config}
              onSaved={onSaved}
            />
          ) : null}
        </TabsContent>

        <TabsContent
          value="test"
          className="mt-0 flex flex-col gap-3 p-4 outline-none"
        >
          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={testLoading}
            onClick={() => void runTest()}
          >
            {testLoading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Запуск…
              </>
            ) : (
              "Запустить тест"
            )}
          </Button>
          {testOk !== null ? (
            <Badge
              className={
                testOk
                  ? "w-fit bg-success/15 text-success"
                  : "w-fit bg-destructive/15 text-destructive"
              }
            >
              {testOk ? "Успех" : "Ошибка"}
            </Badge>
          ) : null}
          {testOut !== null ? (
            <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 font-mono text-xs">
              {JSON.stringify(testOut, null, 2)}
            </pre>
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
