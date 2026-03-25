import { z } from "zod";

const nodeTypeZ = z.enum([
  "TRIGGER_WEBHOOK",
  "TRIGGER_SCHEDULE",
  "TRIGGER_EMAIL",
  "ACTION_HTTP",
  "ACTION_EMAIL",
  "ACTION_TELEGRAM",
  "ACTION_DB",
  "ACTION_TRANSFORM",
]);

export const registerSchema = z
  .object({
    name: z.string().min(1).max(120),
    email: z.string().email(),
    password: z.string().min(8).max(100),
    confirmPassword: z.string().min(8).max(100),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const workflowCreateSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(500).optional().nullable(),
});

export type WorkflowCreateFormValues = z.infer<typeof workflowCreateSchema>;

export const workflowUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  description: z.string().max(500).optional().nullable(),
});

export const nodeCreateSchema = z.object({
  type: nodeTypeZ,
  label: z.string().min(1).max(120),
  positionX: z.number(),
  positionY: z.number(),
  order: z.number().int(),
});

export const nodeUpdateSchema = z.object({
  config: z.record(z.unknown()).optional(),
  label: z.string().min(1).max(120).optional(),
  positionX: z.number().optional(),
  positionY: z.number().optional(),
  order: z.number().int().optional(),
});

export const edgeCreateSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
});

export const edgeDeleteSchema = z.object({
  sourceId: z.string().min(1),
  targetId: z.string().min(1),
});

export const runWorkflowSchema = z.object({
  nodeId: z.string().optional(),
  testMode: z.boolean().optional(),
});

export const publishSchema = z
  .object({
    active: z.boolean().optional(),
  })
  .optional();

const headerRow = z.object({
  key: z.string(),
  value: z.string(),
});

export const webhookConfigSchema = z.object({
  method: z.enum(["POST", "GET", "PUT"]).default("POST"),
  secret: z.string().optional(),
});

export const scheduleFrequencySchema = z.enum([
  "every_minute",
  "every_5_min",
  "every_hour",
  "daily",
  "weekly",
  "custom",
]);

export const scheduleConfigSchema = z.object({
  frequency: scheduleFrequencySchema,
  cronCustom: z.string().optional(),
  timezone: z.enum([
    "UTC",
    "Europe/Moscow",
    "Europe/Kiev",
    "America/New_York",
    "Asia/Tokyo",
  ]),
});

export const emailTriggerConfigSchema = z.object({
  imapHost: z.string().min(1),
  imapPort: z.coerce.number().int().default(993),
  email: z.string().email(),
  password: z.string().min(1),
  filterSubject: z.string().optional(),
});

export const emailTriggerConfigPartialSchema = emailTriggerConfigSchema.partial();
export type EmailTriggerPartialFormValues = z.infer<
  typeof emailTriggerConfigPartialSchema
>;

export const httpActionConfigSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string().url(),
  headers: z.array(headerRow).default([]),
  body: z.string().optional(),
  authType: z.enum(["none", "bearer", "basic"]),
  authValue: z.string().optional(),
});

export const emailActionConfigSchema = z.object({
  to: z.string().email(),
  subject: z.string().max(200),
  body: z.string().max(5000),
  fromName: z.string().max(100).optional(),
});

export const telegramConfigSchema = z.object({
  botToken: z.string().min(1),
  chatId: z.string().min(1),
  message: z.string().max(4096),
  parseMode: z.enum(["text", "markdown", "html"]),
});

export const dbActionConfigSchema = z.object({
  operation: z.enum(["SELECT", "INSERT", "UPDATE", "DELETE"]),
  table: z.string().min(1).max(200),
  query: z.string().max(2000),
});

export const transformOperationSchema = z.enum([
  "parse_json",
  "extract_field",
  "map_array",
  "filter_array",
  "format_date",
  "math",
]);

export const transformConfigSchema = z.object({
  operation: transformOperationSchema,
  input: z.string(),
  fieldPath: z.string().optional(),
  mapExpr: z.string().optional(),
  filterExpr: z.string().optional(),
  dateFormat: z.string().optional(),
  mathExpr: z.string().optional(),
});

export type WebhookConfigInput = z.infer<typeof webhookConfigSchema>;
export type ScheduleConfigInput = z.infer<typeof scheduleConfigSchema>;
export type EmailTriggerConfigInput = z.infer<typeof emailTriggerConfigSchema>;
export type HttpActionConfigInput = z.infer<typeof httpActionConfigSchema>;
export type EmailActionConfigInput = z.infer<typeof emailActionConfigSchema>;
export type TelegramConfigInput = z.infer<typeof telegramConfigSchema>;
export type DbActionConfigInput = z.infer<typeof dbActionConfigSchema>;
export type TransformConfigInput = z.infer<typeof transformConfigSchema>;
