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

function triggerTitle(type: NodeType): string {
  switch (type) {
    case "TRIGGER_WEBHOOK":
      return "Триггер: Webhook";
    case "TRIGGER_SCHEDULE":
      return "Триггер: Расписание";
    case "TRIGGER_EMAIL":
      return "Триггер: Email";
    default:
      return "Триггер";
  }
}

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
      } else {
        toast.success("Тест выполнен");
      }
      setTestOk(res.ok && j.success !== false);
      setTestOut(j.run ?? j);
    } catch {
      setTestOk(false);
      setTestOut({ error: "Request failed" });
      toast.error("Запрос не удался");
    } finally {
      setTestLoading(false);
    }
  };

  if (!open || !node) return null;

  const handleChildSaved = () => {
    onSaved();
    onClose();
  };

  const isTr = String(node.type).startsWith("TRIGGER");
  const Icon = isTr ? Zap : Play;
  const iconClass = isTr ? "text-[#FF4A00]" : "text-[hsl(var(--brand-purple))]";
  const headerTitle = isTr ? triggerTitle(node.type) : node.label;

  return (
    <div
      className={cn(
        "flex flex-col border-border bg-card shadow-lg",
        "max-md:fixed max-md:inset-0 max-md:z-[70] max-md:h-[100dvh] max-md:w-full max-md:border-0 max-md:shadow-xl",
        "max-md:pt-[env(safe-area-inset-top,0px)] max-md:pb-[env(safe-area-inset-bottom,0px)]",
        "md:absolute md:right-0 md:top-0 md:z-30 md:h-full md:w-[320px] md:max-w-[min(100vw,320px)] md:border-l md:border-border"
      )}
    >
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2 md:h-12 md:flex-nowrap md:py-0">
          <Icon className={cn("size-5 shrink-0", iconClass)} />
          <span className="min-w-0 max-w-[calc(100%-8rem)] flex-1 truncate text-sm font-medium md:max-w-none">
            {headerTitle}
          </span>
          <TabsList className="h-8 w-full shrink-0 justify-start sm:w-auto md:justify-center">
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
            className="size-8 shrink-0"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </Button>
        </div>

        <TabsContent
          value="config"
          className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden outline-none"
        >
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {node.type === "TRIGGER_WEBHOOK" ? (
              <WebhookConfig
                workflowId={workflowId}
                nodeId={node.id}
                initial={node.config}
                onSaved={handleChildSaved}
              />
            ) : null}
            {node.type === "TRIGGER_SCHEDULE" ? (
              <ScheduleConfig
                workflowId={workflowId}
                nodeId={node.id}
                initial={node.config}
                onSaved={handleChildSaved}
              />
            ) : null}
            {node.type === "TRIGGER_EMAIL" ? (
              <EmailTriggerConfig
                nodeId={node.id}
                initial={node.config}
                onSaved={handleChildSaved}
              />
            ) : null}
            {node.type === "ACTION_HTTP" ? (
              <HttpActionConfig
                nodeId={node.id}
                initial={node.config}
                onSaved={handleChildSaved}
              />
            ) : null}
            {node.type === "ACTION_EMAIL" ? (
              <EmailActionConfig
                nodeId={node.id}
                initial={node.config}
                onSaved={handleChildSaved}
              />
            ) : null}
            {node.type === "ACTION_TELEGRAM" ? (
              <TelegramConfig
                nodeId={node.id}
                initial={node.config}
                onSaved={handleChildSaved}
              />
            ) : null}
            {node.type === "ACTION_DB" ? (
              <DbActionConfig
                nodeId={node.id}
                initial={node.config}
                onSaved={handleChildSaved}
              />
            ) : null}
            {node.type === "ACTION_TRANSFORM" ? (
              <TransformConfig
                nodeId={node.id}
                initial={node.config}
                onSaved={handleChildSaved}
              />
            ) : null}
          </div>
        </TabsContent>

        <TabsContent
          value="test"
          className="mt-0 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4 outline-none"
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
          <Button
            type="button"
            variant="secondary"
            className="mt-auto w-full"
            onClick={onClose}
          >
            Закрыть панель
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
