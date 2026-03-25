"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  workflowCreateSchema,
  type WorkflowCreateFormValues,
} from "@/lib/validations";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function CreateWorkflowModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WorkflowCreateFormValues>({
    resolver: zodResolver(workflowCreateSchema),
    defaultValues: { name: "", description: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description || undefined,
        }),
      });
      const j = (await res.json()) as {
        error?: string;
        workflow?: { id: string };
      };
      if (!res.ok) {
        const err = j.error ?? "Не удалось создать workflow";
        toast.error(err);
        return;
      }
      setOpen(false);
      reset();
      if (j.workflow?.id) router.push(`/workflows/${j.workflow.id}`);
    } finally {
      setLoading(false);
    }
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={cn(buttonVariants())}>
        Создать workflow
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Новый workflow</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="space-y-2">
            <Label htmlFor="wf-name">Название</Label>
            <Input id="wf-name" disabled={loading} {...register("name")} />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="wf-desc">Описание</Label>
            <Textarea
              id="wf-desc"
              disabled={loading}
              rows={3}
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">
                {errors.description.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Создание…
              </>
            ) : (
              "Создать"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
