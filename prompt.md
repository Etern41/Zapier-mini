## ROLE
You are a Senior Full-Stack Engineer specializing in SaaS automation products.
Your task: build a production-ready Workflow Automation Platform (mini-Zapier) from scratch.
Work autonomously: generate ALL files, run ALL commands, fix ALL errors, validate —
do NOT stop until every single item in the validation checklist passes.
Do NOT ask clarifying questions. Do NOT skip any section. Do NOT use placeholder comments like "// implement later".

---

## CRITICAL LESSONS (read before writing a single line)
These are mistakes to NEVER make:
1. Never use generic shadcn defaults for layout — every color, spacing, radius must match the spec below exactly
2. Never use `any` TypeScript type — use proper types or `unknown` with type guards
3. Never use router.refresh() after mutations — use optimistic state updates
4. Never skip loading states — every async button must be disabled during submit
5. Never skip validation on both client AND server — use the same zod schemas for both
6. Never hardcode colors in components — always use CSS variables (hsl(var(--primary)) etc.)
7. Never leave a component half-implemented — if it's in the file tree, it must be fully working
8. Every API route must return { error: string } on failure with correct HTTP status

---

## VISUAL REFERENCE — IMPLEMENT EXACTLY AS DESCRIBED

### Color Palette (hardcode these values in globals.css)

Light mode:
  --background:         220 16% 96%        ← page bg, light gray NOT white
  --foreground:         222 47% 8%
  --card:               0 0% 100%          ← white cards on gray bg
  --card-foreground:    222 47% 8%
  --border:             220 13% 88%
  --muted:              220 14% 92%
  --muted-foreground:   220 9% 48%
  --primary:            263 70% 50%        ← Zapier/purple #7C3AED
  --primary-foreground: 0 0% 100%
  --success:            142 76% 36%        ← green
  --warning:            38 92% 50%         ← amber
  --destructive:        0 84% 60%          ← red
  --radius:             0.75rem

Dark mode (.dark):
  --background:         222 47% 6%
  --foreground:         213 31% 91%
  --card:               222 47% 9%
  --card-foreground:    213 31% 91%
  --border:             216 34% 17%
  --muted:              223 47% 11%
  --muted-foreground:   215 20% 55%
  --primary:            263 70% 60%
  --primary-foreground: 0 0% 100%

### Layout Structure

SIDEBAR (always dark, w-56, bg-[#111827], text-white — hardcoded, NOT affected by light/dark theme):
  Top section (h-12, flex items-center px-4):
    ⚡ icon (text-violet-400) + "AutoFlow" text (text-white font-bold text-lg)
  
  Nav section (mt-6 px-2):
    Label: "НАВИГАЦИЯ" (text-[10px] uppercase tracking-widest text-slate-500 px-2 mb-1)
    Links (each h-9 flex items-center gap-2.5 px-2 rounded-lg text-sm):
      - /workflows → ZapIcon "Workflows"
      - /history   → ClockIcon "История запусков"
      - /analytics → BarChart2Icon "Аналитика"
    Active state:  bg-white/10 text-white border-l-2 border-violet-400
    Inactive state: text-slate-400 hover:bg-white/5 hover:text-slate-200 transition-colors
  
  Bottom (absolute bottom-0 left-0 right-0 p-3 border-t border-white/10):
    User avatar (w-8 h-8 rounded-full bg-violet-600 text-white text-xs flex items-center justify-center)
    + user name (text-sm text-slate-200)
    + sign out button (LogOutIcon, text-slate-400 hover:text-white)

HEADER (h-12, bg-card, border-b border-border):
  Left: breadcrumb (current page name, text-sm font-medium text-foreground)
  Right: ThemeToggle button + user email (text-xs text-muted-foreground)

DASHBOARD PAGE (/workflows):
  Top stats row (4 cards, grid grid-cols-2 md:grid-cols-4 gap-4 mb-6):
    Each card: white bg, rounded-xl, border, p-4
    - Total Workflows: number + "workflows" label
    - Active: number + green dot indicator
    - Runs Today: number + clock icon
    - Success Rate: percentage + progress bar
  
  Workflows table (bg-card rounded-xl border overflow-hidden):
    Header row: Name | Status | Last Run | Total Runs | Success % | Actions
    Each row (hover:bg-muted/50 transition-colors):
      - Name: font-medium + description (text-xs text-muted-foreground)
      - Status: toggle switch (ON=green, OFF=gray) — clicking calls PATCH /api/workflows/[id]/publish
      - Last Run: relative time (date-fns formatDistanceToNow) or "Never"
      - Total Runs: number
      - Success %: colored badge (green ≥80%, amber 50-79%, red <50%)
      - Actions: Edit button (→ /workflows/[id]) + Delete button (with confirm dialog)
    Empty state: centered illustration + "No workflows yet" + "Create your first workflow" button

WORKFLOW EDITOR PAGE (/workflows/[id]):
  Full viewport layout (no dashboard content padding, overflow-hidden):
  
  TOP BAR (h-12, bg-card, border-b, px-4, flex items-center gap-3, z-10):
    Left:
      Back arrow button (← /workflows)
      Separator (w-px h-5 bg-border)
      Workflow name: click to edit inline (input appears, blur to save, max 120 chars)
      Status badge: "Draft" (gray) or "Active" (green) — rounded-full px-2 py-0.5 text-xs
    Right:
      ON/OFF toggle (green when active) — calls POST /api/workflows/[id]/publish
      Save button: outline variant, "Saved" shows for 2s after save with check icon
      Publish button: primary (purple) — activates workflow, changes to "Unpublish" when active
  
  MAIN AREA (flex-1, flex flex-row, overflow-hidden):
    LEFT ICON RAIL (w-12, bg-[#111827], flex flex-col items-center py-3 gap-1):
      Icon buttons with tooltips:
        - ZapIcon: "Triggers"
        - PlayIcon: "Actions"  
        - ClockIcon: "Run History"
        - SettingsIcon: "Settings"
      Each: w-9 h-9 rounded-lg flex items-center justify-center
      Active: bg-white/15 text-white
      Inactive: text-slate-500 hover:bg-white/10 hover:text-slate-300
    
    CANVAS AREA (flex-1, bg-[hsl(var(--muted))] relative overflow-hidden):
      React Flow canvas (@xyflow/react)
      Background: BackgroundVariant.Dots, gap=20, size=1, color="#d1d5db"
      Controls: bottom-left (zoom in/out/fit)
      MiniMap: bottom-right (hidden on mobile)
      
      Nodes rendered vertically, centered on canvas
      Nodes connected by ANIMATED dashed edges (animated=true, strokeDasharray="5,5")
      Arrow direction: top → bottom
      
      TRIGGER NODE (custom React Flow node, TriggerNode.tsx):
        Width: 288px, bg-card, rounded-xl, border-2 border-violet-200 dark:border-violet-800
        Top strip (h-1.5, bg-gradient-to-r from-violet-500 to-purple-600, rounded-t-xl)
        Content (p-4):
          Row 1: ZapIcon (text-violet-500) + "Trigger" label (text-xs uppercase text-muted-foreground) + step badge (#1 gray circle)
          Row 2: Bold title (node.label or "Choose a trigger") text-sm font-semibold
          Row 3: Config summary (text-xs text-muted-foreground, 1 line truncate)
            - If not configured: "Click to configure →" (text-violet-500)
            - If configured: brief summary (e.g. "Webhook · POST" or "Daily at 09:00 UTC")
          Row 4 (only if configured): status dot
            - gray = draft, green = active, red = error
        On hover: shadow-lg border-violet-300 dark:border-violet-700 transition-all duration-150
        On click: opens RIGHT CONFIG PANEL
        Three-dot menu (⋮) top-right corner, appears on hover:
          - "Edit" → opens config panel
          - "Delete" → confirm then remove node + connected edges
      
      ACTION NODE (custom React Flow node, ActionNode.tsx):
        Same as TriggerNode but:
          Border: border-gray-200 dark:border-gray-700 (no violet)
          Top strip: bg-gradient-to-r from-blue-500 to-cyan-500
          Icon: PlayIcon (text-blue-500)
          Label: "Action · Step {N}"
      
      ADD NODE BUTTON (AddNodeButton.tsx):
        Positioned between nodes on the edge midpoint
        Appearance: w-7 h-7 rounded-full bg-card border-2 border-dashed border-border
          flex items-center justify-center text-muted-foreground
          hover:border-violet-400 hover:text-violet-500 hover:bg-violet-50 transition-all
        On click: opens NodePicker modal
      
      NODE PICKER MODAL (NodePicker.tsx):
        shadcn Dialog, max-w-lg
        Title: "Add a step"
        Two sections:
          If no trigger exists: show "Triggers" section first
          "Actions" section always
        Each option: icon + name + description, in a grid 2 cols
        Trigger options:
          - WebhookIcon "Webhook" "Receive HTTP requests"
          - CalendarIcon "Расписание" "Run on a schedule"
          - MailIcon "Email" "Triggered by incoming email"
        Action options:
          - GlobeIcon "HTTP Request" "Make API calls"
          - MailIcon "Email" "Send an email"
          - SendIcon "Telegram" "Send Telegram message"
          - DatabaseIcon "Database" "Query your database"
          - ShuffleIcon "Transform" "Process and transform data"
        Clicking option: creates node in DB, adds to canvas, opens config panel
    
    RIGHT CONFIG PANEL (NodeConfigPanel.tsx):
      Position: absolute right-0 top-0 bottom-0 w-96 bg-card border-l border-border
      Animation: translate-x-full → translate-x-0 (transition-transform duration-200)
      Appears when node is selected, hidden when deselected or X clicked
      
      Panel header (h-12 px-4 border-b flex items-center):
        Node type icon (colored) + node title
        Tabs: "Настройка" | "Тест"
        X close button (ml-auto)
      
      Configure tab (overflow-y-auto, p-4, space-y-4):
        Render the correct config component based on node.type
        Save button at bottom: "Сохранить" primary, full-width
        Clicking Save: PATCH /api/nodes/[id] with config, optimistically update node summary
      
      Test tab (p-4):
        "Запустить тест" button (outline, full-width)
        On click: POST /api/workflows/[id]/run with { nodeId, testMode: true }
        Show spinner while running
        After completion: JSON output formatted with syntax highlighting (pre tag, bg-muted, rounded, p-3 text-xs overflow-auto)
        Status: green "Успех" or red "Ошибка" badge

  Each config component (in /components/editor/config/):
    Must use react-hook-form + zod resolver
    On change: auto-save debounced 500ms to PATCH /api/nodes/[id]
    Show field-level validation errors inline
    
    WebhookConfig.tsx:
      - Webhook URL field: read-only Input with copy button (ClipboardIcon, toast "Скопировано!")
        URL = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/${workflowId}`
      - Method: Select (POST | GET | PUT) default POST
      - Secret: Input placeholder "Опционально — для верификации подписи"
    
    ScheduleConfig.tsx:
      - Frequency: Select
          Every minute | Every 5 min | Every hour | Daily | Weekly | Custom
      - If Custom: Input "Cron выражение" with helper link to crontab.guru
      - Timezone: Select (UTC | Europe/Moscow | Europe/Kiev | America/New_York | Asia/Tokyo)
      - "Следующий запуск:" — computed with node-cron, shown in muted text
      - Last 3 runs: list (if any)
    
    EmailTriggerConfig.tsx:
      - IMAP Host: Input
      - IMAP Port: Input type=number default=993
      - Email: Input type=email
      - Password: Input type=password
      - Filter subject: Input placeholder="Опционально"
      - Info banner: "Проверка почты каждые 5 минут"
    
    HttpActionConfig.tsx:
      - Method: Select (GET | POST | PUT | PATCH | DELETE)
      - URL: Input placeholder="https://api.example.com/endpoint" (zod url validation)
      - Headers section: key-value list
          Each row: Input (key) + Input (value) + X button
          "+ Добавить заголовок" button
      - Body: Textarea (shown only if method is POST/PUT/PATCH)
          placeholder='{"key": "value"}' monospace font
      - Auth: Select (Нет | Bearer Token | Basic Auth)
      - Auth value: Input (shown if auth != None)
      - Variables hint: "Используйте {{шаг1.поле}} для данных из предыдущих шагов"
    
    EmailActionConfig.tsx:
      - To: Input type=email (required)
      - Subject: Input maxLength=200 with character counter
      - Body: Textarea maxLength=5000 with character counter
      - From name: Input maxLength=100
      - Variables hint banner
    
    TelegramConfig.tsx:
      - Bot Token: Input type=password (required) with link "Как получить токен?"
      - Chat ID: Input (required) with link "Как найти Chat ID?"
      - Message: Textarea maxLength=4096 with counter
      - Parse mode: Select (Обычный | Markdown | HTML)
      - Variables hint banner
    
    DbActionConfig.tsx:
      - Warning banner: AlertTriangleIcon amber bg "Осторожно: выполняется реальный SQL запрос"
      - Operation: Select (SELECT | INSERT | UPDATE | DELETE)
      - Table: Input placeholder="users"
      - Query: Textarea monospace font placeholder="SELECT * FROM users WHERE id = '{{trigger.id}}'"
        maxLength=2000
      - Info: "Используется DATABASE_URL приложения"
      - Variables hint banner

    TransformConfig.tsx:
      - Operation: Select
          Parse JSON | Extract Field | Map Array | Filter Array | Format Date | Math
      - Input: Textarea placeholder="{{предыдущий_шаг.поле}}" 
      - Dynamic config fields by operation:
          Extract Field  → Input "Путь к полю" placeholder="data.user.email"
          Map Array      → Input "Выражение" placeholder="item.name"
          Filter Array   → Input "Условие" placeholder="item.active === true"
          Format Date    → Input "Формат" placeholder="dd.MM.yyyy HH:mm"
          Math           → Input "Выражение" placeholder="{{value}} * 100 / {{total}}"
          Parse JSON     → no extra fields
      - Output preview box: bg-muted rounded p-2 text-xs font-mono
          Shows computed result from Input + config using current values
          Updates live on input change (debounced 300ms, computed client-side)

---

## STACK

- Framework:      Next.js 14 (App Router, TypeScript strict)
- Database:       PostgreSQL via Prisma ORM
- Auth:           NextAuth.js v5 (credentials: email+password, bcryptjs rounds=12)
- UI:             Tailwind CSS + shadcn/ui
- Canvas:         @xyflow/react v12 (React Flow)
- Queue:          BullMQ + ioredis
- Cron:           node-cron
- Email action:   Resend
- Email trigger:  imapflow
- Telegram:       node-telegram-bot-api
- HTTP client:    axios
- Validation:     zod (same schemas server + client)
- Forms:          react-hook-form + @hookform/resolvers
- API Docs:       swagger-ui-react + zod-to-openapi
- Dates:          date-fns
- Charts:         recharts
- Themes:         next-themes (Light / Dark / System)
- Toast:          sonner
- Deploy:         Vercel
- Redis:          Upstash (UPSTASH_REDIS_URL env var)
- Linting:        ESLint + Prettier

Install commands (run in order):
```bash
npx create-next-app@latest autoflow --typescript --tailwind --app --eslint --no-src-dir
cd autoflow
npm install @prisma/client prisma
npm install next-auth@beta bcryptjs @types/bcryptjs
npm install @xyflow/react
npm install bullmq ioredis
npm install resend
npm install imapflow
npm install node-telegram-bot-api @types/node-telegram-bot-api
npm install axios
npm install zod react-hook-form @hookform/resolvers
npm install node-cron @types/node-cron
npm install date-fns
npm install recharts
npm install next-themes sonner
npm install zod-to-openapi swagger-ui-react
npm install @types/swagger-ui-react
npx shadcn@latest init
# Select: Default style, Zinc, CSS variables: yes
npx shadcn@latest add button card badge dialog select avatar sheet tabs \
  input textarea label dropdown-menu separator skeleton progress \
  tooltip switch alert popover



EXACT FILE TREE (generate EVERY file, NO exceptions)
/app
  /layout.tsx
  /globals.css
  /(auth)
    /login/page.tsx
    /register/page.tsx
  /(dashboard)
    /layout.tsx
    /page.tsx                          ← redirect to /workflows
    /workflows
      /page.tsx                        ← dashboard + workflow list
      /[id]/page.tsx                   ← editor page (full viewport, no padding)
      /[id]/runs/page.tsx              ← run history for workflow
    /history/page.tsx                  ← global history
    /analytics/page.tsx

/components
  /auth/LoginForm.tsx
  /auth/RegisterForm.tsx
  /layout/Sidebar.tsx
  /layout/Header.tsx
  /layout/ThemeToggle.tsx
  /workflows/WorkflowList.tsx
  /workflows/WorkflowCard.tsx
  /workflows/CreateWorkflowModal.tsx
  /workflows/WorkflowStatusBadge.tsx
  /editor/WorkflowEditor.tsx
  /editor/EditorTopBar.tsx
  /editor/NodeConfigPanel.tsx
  /editor/AddNodeButton.tsx
  /editor/NodePicker.tsx
  /editor/nodes/TriggerNode.tsx
  /editor/nodes/ActionNode.tsx
  /editor/config/WebhookConfig.tsx
  /editor/config/ScheduleConfig.tsx
  /editor/config/EmailTriggerConfig.tsx
  /editor/config/HttpActionConfig.tsx
  /editor/config/EmailActionConfig.tsx
  /editor/config/TelegramConfig.tsx
  /editor/config/DbActionConfig.tsx
  /editor/config/TransformConfig.tsx
  /runs/RunsTable.tsx
  /runs/RunLogPanel.tsx
  /runs/StepLogRow.tsx
  /analytics/StatsCards.tsx
  /analytics/RunsLineChart.tsx
  /analytics/WorkflowBarChart.tsx
  /analytics/FailuresTable.tsx

/lib
  /auth.ts
  /prisma.ts
  /validations.ts
  /utils.ts
  /interpolate.ts
  /notifications.ts
  /queue/client.ts
  /queue/worker.ts
  /executor/index.ts
  /executor/steps/http.ts
  /executor/steps/email.ts
  /executor/steps/telegram.ts
  /executor/steps/db.ts
  /executor/steps/transform.ts
  /triggers/webhook.ts
  /triggers/scheduler.ts
  /triggers/emailPoller.ts

/prisma/schema.prisma

/worker/index.ts

/app/api
  /auth/[...nextauth]/route.ts
  /workflows/route.ts
  /workflows/[id]/route.ts
  /workflows/[id]/publish/route.ts
  /workflows/[id]/run/route.ts
  /workflows/[id]/runs/route.ts
  /workflows/[id]/nodes/route.ts
  /workflows/[id]/edges/route.ts
  /nodes/[id]/route.ts
  /webhooks/[workflowId]/route.ts
  /analytics/route.ts
  /docs/route.ts
  /openapi.json/route.ts

middleware.ts
vercel.json
.env.example
README.md



DATABASE SCHEMA (prisma/schema.prisma) — generate exactly this
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String     @id @default(cuid())
  email     String     @unique
  name      String     @db.VarChar(120)
  password  String
  createdAt DateTime   @default(now())
  workflows Workflow[]
}

model Workflow {
  id            String         @id @default(cuid())
  name          String         @db.VarChar(120)
  description   String?        @db.VarChar(500)
  userId        String
  user          User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  isActive      Boolean        @default(false)
  webhookSecret String?
  nodes         WorkflowNode[]
  edges         WorkflowEdge[]
  runs          WorkflowRun[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

model WorkflowNode {
  id         String   @id @default(cuid())
  workflowId String
  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  type       NodeType
  label      String   @db.VarChar(120)
  config     Json     @default("{}")
  positionX  Float    @default(0)
  positionY  Float    @default(0)
  order      Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model WorkflowEdge {
  id         String   @id @default(cuid())
  workflowId String
  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  sourceId   String
  targetId   String
  createdAt  DateTime @default(now())
}

model WorkflowRun {
  id         String      @id @default(cuid())
  workflowId String
  workflow   Workflow    @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  status     RunStatus   @default(RUNNING)
  trigger    String      @db.VarChar(50)
  startedAt  DateTime    @default(now())
  finishedAt DateTime?
  error      String?     @db.VarChar(2000)
  steps      StepLog[]
}

model StepLog {
  id        String     @id @default(cuid())
  runId     String
  run       WorkflowRun @relation(fields: [runId], references: [id], onDelete: Cascade)
  nodeId    String
  nodeLabel String     @db.VarChar(120)
  status    StepStatus
  input     Json?
  output    Json?
  error     String?    @db.VarChar(2000)
  duration  Int?
  attempt   Int        @default(1)
  createdAt DateTime   @default(now())
}

enum NodeType {
  TRIGGER_WEBHOOK
  TRIGGER_SCHEDULE
  TRIGGER_EMAIL
  ACTION_HTTP
  ACTION_EMAIL
  ACTION_TELEGRAM
  ACTION_DB
  ACTION_TRANSFORM
}

enum RunStatus  { RUNNING SUCCESS FAILED PAUSED }
enum StepStatus { PENDING RUNNING SUCCESS FAILED SKIPPED }


ENVIRONMENT VARIABLES
Create .env.example:
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=
TELEGRAM_BOT_TOKEN=
UPSTASH_REDIS_URL=redis://default:password@host:port
CRON_SECRET=

COMPLETE FUNCTIONAL REQUIREMENTS
AUTH
Register: name (max 120), email, password (min 8, max 100), confirm password
Hash with bcryptjs rounds=12. On success → redirect /workflows

Login: email + password → JWT session via NextAuth v5
Wrong password → inline error "Неверный email или пароль"

middleware.ts: protect all /(dashboard) routes → redirect /login if unauthenticated
Public routes: /login, /register, /api/webhooks/*, /api/docs, /api/openapi.json

All forms: loading state (button disabled + spinner), zod validation, field-level errors

WORKFLOW CRUD
GET /api/workflows → list user's workflows with _count of runs and nodes
POST /api/workflows → create { name, description? } → returns created workflow
GET /api/workflows/[id] → get workflow with nodes + edges
PATCH /api/workflows/[id] → update { name?, description? }
DELETE /api/workflows/[id] → delete workflow + cascade (nodes, edges, runs, steps)
POST /api/workflows/[id]/publish → toggle isActive (true/false)
When activating: validate workflow has at least 1 trigger node + 1 action node
If schedule trigger: start node-cron job
If already running cron: stop old, start new
Return { isActive: boolean, error?: string }

NODES & EDGES
GET /api/workflows/[id]/nodes → list nodes ordered by order ASC
POST /api/workflows/[id]/nodes → create node { type, label, positionX, positionY, order }
Auto-generate webhookSecret on Workflow if first TRIGGER_WEBHOOK node added
PATCH /api/nodes/[id] → update { config?, label?, positionX?, positionY? }
DELETE /api/nodes/[id] → delete node + connected edges

GET /api/workflows/[id]/edges → list edges
POST /api/workflows/[id]/edges → create edge { sourceId, targetId }
DELETE /api/workflows/[id]/edges → delete edge { sourceId, targetId } in body

WEBHOOK TRIGGER
GET/POST /api/webhooks/[workflowId]

Find workflow by id where isActive=true

Validate secret header if webhookSecret is set
Header: X-Webhook-Secret must match workflow.webhookSecret

Extract body (JSON or form data) as triggerData

Enqueue BullMQ job: { workflowId, triggerData, trigger: "webhook" }

Return 200 { received: true, runId } immediately (do NOT await execution)

Return 403 if secret mismatch, 404 if workflow not found or inactive

EXECUTION ENGINE (lib/executor/index.ts)
runWorkflow(workflowId: string, triggerData: Record<string, unknown>, trigger: string):

Create WorkflowRun record (status=RUNNING)

Fetch workflow nodes ordered by order ASC, skip trigger node (index 0)

Initialize context: { [nodeId]: output } — trigger node output = triggerData

For each action node (in order):
a. Create StepLog (status=RUNNING, input=context so far)
b. Call executor for node.type with (node.config, context)
c. interpolate all string values in config using lib/interpolate.ts BEFORE passing to executor
d. On success: update StepLog (status=SUCCESS, output, duration)
add output to context[nodeId]
e. On error (first attempt):

Wait 2 seconds, retry once

If retry also fails: update StepLog (status=FAILED, error)

Update WorkflowRun (status=FAILED, error)

Call notifications.ts to send error email to workflow owner

STOP execution (do not continue to next steps)

If all steps succeed: update WorkflowRun (status=SUCCESS, finishedAt=now())

lib/interpolate.ts:
interpolate(template: string, context: Record<string, unknown>): string
Replace {{nodeId.field.nested}} with value from context
Example: "Hello {{step1.name}}" + context = { step1: { name: "World" } } → "Hello World"
Support dot notation for nested objects
If path not found: leave placeholder as-is (do not throw)

Executors:

lib/executor/steps/http.ts:
Input: config (method, url, headers, body, authType, authValue), context

Interpolate url, headers values, body using context

Build axios request config

If authType=Bearer: add Authorization: Bearer {authValue} header
