"use client";

import { useEffect, useMemo, useState } from "react";
import { RunsTable, type RunRow } from "@/components/runs/RunsTable";
import { ListPagination } from "@/components/ui/list-pagination";

const PAGE_SIZE = 15;

export function WorkflowRunsClient({
  runs,
  workflowId,
}: {
  runs: RunRow[];
  workflowId: string;
}) {
  const [page, setPage] = useState(1);
  const total = runs.length;

  useEffect(() => {
    setPage(1);
  }, [workflowId, runs.length]);

  const slice = useMemo(
    () => runs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [runs, page]
  );

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);

  return (
    <RunsTable
      runs={slice}
      workflowId={workflowId}
      footer={
        <ListPagination
          page={safePage}
          pageSize={PAGE_SIZE}
          total={total}
          onPageChange={setPage}
        />
      }
    />
  );
}
