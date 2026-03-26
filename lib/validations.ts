import { z } from "zod";

/** Лимиты длины (символов) для форм и API */
export const LIMITS = {
  shortLabel: 120,
  workflowDescription: 500,
  email: 254,
  password: 128,
  cuidLikeId: 128,
  webhookSecret: 512,
  cronExpr: 120,
  imapHost: 253,
  imapPassword: 512,
  filterSubject: 300,
  httpUrl: 2048,
  httpBody: 50_000,
  httpHeaderKey: 256,
  httpHeaderValue: 8192,
  httpHeadersMax: 40,
  httpAuthValue: 4000,
  telegramToken: 120,
  telegramChatId: 64,
  telegramMessage: 4096,
  dbTable: 200,
  dbQuery: 2000,
  emailSubject: 200,
  emailBody: 5000,
  fromName: 100,
  transformInput: 50_000,
  transformExpr: 4000,
  nodeConfigJson: 600_000,
} as const;

const ru = {
  required: "Заполните поле",
  max: (n: number) => `Слишком длинно (макс. ${n} символов)`,
  email: "Неверный формат email",
  url: "Нужна полная ссылка (http:// или https://)",
  port: "Порт от 1 до 65535",
  headersCount: `Не больше ${LIMITS.httpHeadersMax} заголовков`,
} as const;

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
    name: z
      .string()
      .min(1, { message: ru.required })
      .max(LIMITS.shortLabel, { message: ru.max(LIMITS.shortLabel) }),
    email: z
      .string()
      .max(LIMITS.email, { message: ru.max(LIMITS.email) })
      .email({ message: ru.email }),
    password: z
      .string()
      .min(8, { message: "Минимум 8 символов" })
      .max(LIMITS.password, { message: ru.max(LIMITS.password) }),
    confirmPassword: z
      .string()
      .min(8, { message: "Минимум 8 символов" })
      .max(LIMITS.password, { message: ru.max(LIMITS.password) }),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Пароли не совпадают",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z
    .string()
    .max(LIMITS.email, { message: ru.max(LIMITS.email) })
    .email({ message: ru.email }),
  password: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.password, { message: ru.max(LIMITS.password) }),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const workflowCreateSchema = z.object({
  name: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.shortLabel, { message: ru.max(LIMITS.shortLabel) }),
  description: z
    .string()
    .max(LIMITS.workflowDescription, {
      message: ru.max(LIMITS.workflowDescription),
    })
    .optional()
    .nullable(),
});

export type WorkflowCreateFormValues = z.infer<typeof workflowCreateSchema>;

export const workflowUpdateSchema = z.object({
  name: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.shortLabel, { message: ru.max(LIMITS.shortLabel) })
    .optional(),
  description: z
    .string()
    .max(LIMITS.workflowDescription, {
      message: ru.max(LIMITS.workflowDescription),
    })
    .optional()
    .nullable(),
});

export const nodeCreateSchema = z.object({
  type: nodeTypeZ,
  label: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.shortLabel, { message: ru.max(LIMITS.shortLabel) }),
  positionX: z.number(),
  positionY: z.number(),
  order: z.number().int(),
});

export const nodeUpdateSchema = z
  .object({
    config: z.record(z.unknown()).optional(),
    label: z
      .string()
      .min(1, { message: ru.required })
      .max(LIMITS.shortLabel, { message: ru.max(LIMITS.shortLabel) })
      .optional(),
    positionX: z.number().optional(),
    positionY: z.number().optional(),
    order: z.number().int().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.config === undefined) return;
    try {
      const len = JSON.stringify(data.config).length;
      if (len > LIMITS.nodeConfigJson) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: ru.max(LIMITS.nodeConfigJson),
          path: ["config"],
        });
      }
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Не удалось сохранить настройки шага",
        path: ["config"],
      });
    }
  });

export const edgeCreateSchema = z.object({
  sourceId: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.cuidLikeId, { message: ru.max(LIMITS.cuidLikeId) }),
  targetId: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.cuidLikeId, { message: ru.max(LIMITS.cuidLikeId) }),
});

export const edgeDeleteSchema = z.object({
  sourceId: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.cuidLikeId, { message: ru.max(LIMITS.cuidLikeId) }),
  targetId: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.cuidLikeId, { message: ru.max(LIMITS.cuidLikeId) }),
});

export const runWorkflowSchema = z.object({
  nodeId: z
    .string()
    .max(LIMITS.cuidLikeId, { message: ru.max(LIMITS.cuidLikeId) })
    .optional(),
  testMode: z.boolean().optional(),
});

export const publishSchema = z
  .object({
    active: z.boolean().optional(),
  })
  .optional();

const headerRow = z.object({
  key: z
    .string()
    .max(LIMITS.httpHeaderKey, { message: ru.max(LIMITS.httpHeaderKey) }),
  value: z
    .string()
    .max(LIMITS.httpHeaderValue, { message: ru.max(LIMITS.httpHeaderValue) }),
});

export const webhookConfigSchema = z.object({
  method: z.enum(["POST", "GET", "PUT"]).default("POST"),
  secret: z
    .string()
    .max(LIMITS.webhookSecret, { message: ru.max(LIMITS.webhookSecret) })
    .optional(),
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
  cronCustom: z
    .string()
    .max(LIMITS.cronExpr, { message: ru.max(LIMITS.cronExpr) })
    .optional(),
  timezone: z.enum([
    "UTC",
    "Europe/Moscow",
    "Europe/Kiev",
    "America/New_York",
    "Asia/Tokyo",
  ]),
});

export const emailTriggerConfigSchema = z.object({
  imapHost: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.imapHost, { message: ru.max(LIMITS.imapHost) }),
  imapPort: z.coerce
    .number()
    .int()
    .min(1, { message: ru.port })
    .max(65535, { message: ru.port })
    .default(993),
  email: z
    .string()
    .max(LIMITS.email, { message: ru.max(LIMITS.email) })
    .email({ message: ru.email }),
  password: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.imapPassword, { message: ru.max(LIMITS.imapPassword) }),
  filterSubject: z
    .string()
    .max(LIMITS.filterSubject, { message: ru.max(LIMITS.filterSubject) })
    .optional(),
});

export const emailTriggerConfigPartialSchema = emailTriggerConfigSchema.partial();
export type EmailTriggerPartialFormValues = z.infer<
  typeof emailTriggerConfigPartialSchema
>;

export const httpActionConfigSchema = z.object({
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z
    .string()
    .max(LIMITS.httpUrl, { message: ru.max(LIMITS.httpUrl) })
    .url({ message: ru.url }),
  headers: z
    .array(headerRow)
    .max(LIMITS.httpHeadersMax, { message: ru.headersCount })
    .default([]),
  body: z
    .string()
    .max(LIMITS.httpBody, { message: ru.max(LIMITS.httpBody) })
    .optional(),
  authType: z.enum(["none", "bearer", "basic"]),
  authValue: z
    .string()
    .max(LIMITS.httpAuthValue, { message: ru.max(LIMITS.httpAuthValue) })
    .optional(),
});

export const emailActionConfigSchema = z.object({
  to: z
    .string()
    .max(LIMITS.email, { message: ru.max(LIMITS.email) })
    .email({ message: ru.email }),
  subject: z
    .string()
    .max(LIMITS.emailSubject, { message: ru.max(LIMITS.emailSubject) }),
  body: z
    .string()
    .max(LIMITS.emailBody, { message: ru.max(LIMITS.emailBody) }),
  fromName: z
    .string()
    .max(LIMITS.fromName, { message: ru.max(LIMITS.fromName) })
    .optional(),
});

export const telegramConfigSchema = z.object({
  botToken: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.telegramToken, { message: ru.max(LIMITS.telegramToken) }),
  chatId: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.telegramChatId, { message: ru.max(LIMITS.telegramChatId) }),
  message: z
    .string()
    .max(LIMITS.telegramMessage, { message: ru.max(LIMITS.telegramMessage) }),
  parseMode: z.enum(["text", "markdown", "html"]),
});

export const dbActionConfigSchema = z.object({
  operation: z.enum(["SELECT", "INSERT", "UPDATE", "DELETE"]),
  table: z
    .string()
    .min(1, { message: ru.required })
    .max(LIMITS.dbTable, { message: ru.max(LIMITS.dbTable) }),
  query: z
    .string()
    .max(LIMITS.dbQuery, { message: ru.max(LIMITS.dbQuery) }),
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
  input: z
    .string()
    .max(LIMITS.transformInput, { message: ru.max(LIMITS.transformInput) }),
  fieldPath: z
    .string()
    .max(LIMITS.transformExpr, { message: ru.max(LIMITS.transformExpr) })
    .optional(),
  mapExpr: z
    .string()
    .max(LIMITS.transformExpr, { message: ru.max(LIMITS.transformExpr) })
    .optional(),
  filterExpr: z
    .string()
    .max(LIMITS.transformExpr, { message: ru.max(LIMITS.transformExpr) })
    .optional(),
  dateFormat: z
    .string()
    .max(LIMITS.transformExpr, { message: ru.max(LIMITS.transformExpr) })
    .optional(),
  mathExpr: z
    .string()
    .max(LIMITS.transformExpr, { message: ru.max(LIMITS.transformExpr) })
    .optional(),
});

export type WebhookConfigInput = z.infer<typeof webhookConfigSchema>;
export type ScheduleConfigInput = z.infer<typeof scheduleConfigSchema>;
export type EmailTriggerConfigInput = z.infer<typeof emailTriggerConfigSchema>;
export type HttpActionConfigInput = z.infer<typeof httpActionConfigSchema>;
export type EmailActionConfigInput = z.infer<typeof emailActionConfigSchema>;
export type TelegramConfigInput = z.infer<typeof telegramConfigSchema>;
export type DbActionConfigInput = z.infer<typeof dbActionConfigSchema>;
export type TransformConfigInput = z.infer<typeof transformConfigSchema>;
