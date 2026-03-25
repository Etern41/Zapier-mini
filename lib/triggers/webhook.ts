/**
 * Webhook trigger is handled in app/api/webhooks/[workflowId]/route.ts
 * by validating the secret and enqueueing a BullMQ job.
 */
export const WEBHOOK_HEADER_SECRET = "x-webhook-secret";
