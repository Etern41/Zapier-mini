Теперь у меня полная картина по всему репо. Пишу финальный аудит-промпт.

***

Вот все найденные проблемы по коду, структурированные в один исчерпывающий промпт:

**Ключевые находки аудита:**

1. **NodePicker скрывает триггеры** когда `hasTrigger=true` — поэтому нельзя добавить второй триггер
2. **DropdownMenu в нодах** использует контролируемый `open={menuOpen}` + `onOpenChange={setMenuOpen}`, но `onClick` на триггере вызывает `e.stopPropagation()` что при base-ui может прерывать открытие
3. **Два "Сохранить"** — один в каждой конфиг-форме (TelegramConfig и др.), второй в footer NodeConfigPanel
4. **Autosave вызывает `onSaved()`** из `useEffect` при каждом debounce → reload() → Prisma spam
5. **Тёмная тема** — переменные `--background: 222 47% 6%` очень тёмные, `--card: 222 47% 9%` почти не отличается, UI сливается
6. **EditorTopBar** имеет "Сохранить" кнопку (для имени) которая стоит рядом с "Тестовый запуск" и "Опубликовать" — концептуально непонятно что именно она сохраняет

***

```md
# AutoFlow — Full Codebase Audit & Production Fix Prompt

You are working on **AutoFlow** — a workflow automation SaaS (mini-Zapier).
Stack: Next.js 14 App Router, TypeScript strict, Prisma + PostgreSQL, BullMQ,
React Flow (@xyflow/react), Tailwind CSS, shadcn/ui (base-ui primitives), sonner toasts.

This is a **full surgical fix pass**. You have the full codebase available.
Work through every section below in order. For each fix, touch ONLY the minimum
set of files required. Do NOT change Prisma schema, API routes, or worker code.
All UI text stays in Russian.

After ALL changes: run `npm run lint` and `npm run build`. Fix every error.

---

## SECTION 1 — CRITICAL BUG: cannot add more than one trigger

### Root cause
`components/editor/NodePicker.tsx` renders the "Триггеры" section only when
`!hasTrigger`. Once the first trigger exists, the entire trigger section is
hidden, so users can never add a second trigger type.

### Fix
Remove the `!hasTrigger` condition that hides triggers. Instead, always show
both sections. The only restriction Zapier itself enforces is "one trigger
active at a time" — but that is a runtime concern for the worker, not a UI lock.

```tsx
// NodePicker.tsx — REMOVE the conditional wrapper
// BEFORE:
{!hasTrigger ? (
  <section>
    <h3 className="section-label mb-2 px-0">Триггеры</h3>
    ...
  </section>
) : null}

// AFTER: always render, but visually differentiate
<section>
  <h3 className="section-label mb-2 px-0">Триггеры</h3>
  {hasTrigger && (
    <p className="mb-2 text-xs text-muted-foreground">
      В воркфлоу уже есть триггер. Добавление второго заменит стартовую точку.
    </p>
  )}
  <div className="grid grid-cols-2 gap-2">
    {triggerOptions.map(...)}
  </div>
</section>
```

Also remove `hasTrigger` prop from `WorkflowEditor.tsx` call to `<NodePicker>`
and from NodePicker's props interface — it is no longer needed as a gate.
Keep passing it only if you still need it for the informational banner above.

---

## SECTION 2 — CRITICAL BUG: three-dot menu on nodes does not open

### Root cause
`TriggerNode.tsx` and `ActionNode.tsx` use **controlled** `DropdownMenu` with
`open={menuOpen} onOpenChange={setMenuOpen}`. The trigger button has
`onClick={(e) => e.stopPropagation()}`. With `@base-ui/react`'s Menu primitive,
`stopPropagation` on the trigger's click event can prevent the internal open
handler from firing, because base-ui listens at the document level and the
stopped event never bubbles up.

### Fix
Switch both nodes to **uncontrolled** DropdownMenu. Remove local `menuOpen`
state and the `open`/`onOpenChange` props entirely. The dropdown will manage
its own open state internally.

```tsx
// TriggerNode.tsx and ActionNode.tsx — apply same change to both

// REMOVE:
const [menuOpen, setMenuOpen] = useState(false);

// CHANGE:
<DropdownMenu>                          // no open / onOpenChange
  <DropdownMenuTrigger
    className="rounded p-1 text-muted-foreground hover:bg-muted"
    onClick={(e) => e.stopPropagation()} // keep stopPropagation to avoid node select
    aria-label="Меню узла"
  >
    <MoreVertical className="size-4" />
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end" className="z-">
    <DropdownMenuItem
      onClick={(e) => {
        e.stopPropagation();
        d.onSelect();
      }}
    >
      Настроить
    </DropdownMenuItem>
    <DropdownMenuItem
      variant="destructive"
      onClick={(e) => {
        e.stopPropagation();
        d.onDelete();
      }}
    >
      Удалить
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**Important**: Increase z-index of DropdownMenuContent to `z-[200]` (above
the NodeConfigPanel which is `z-30` and the NodePicker Dialog which is
`z-[120]`).

Also ensure the node outer `div` does NOT have `onClick` that immediately
re-selects the node when the menu closes — check that `d.onSelect()` is only
called from inside the menu item "Настроить" and from the outer div click
(but not both simultaneously). The outer `div onClick={() => d.onSelect()}`
is fine — it fires on the card body, not on the menu button.

---

## SECTION 3 — BUG: keyboard Delete/Backspace "resurrects" nodes

### Root cause (already partially analyzed)
`onBeforeDelete` confirms and `onNodesDelete` calls `removeNodesByIds`. This
path IS implemented. However, the confirmation dialog (`confirm()`) is a
synchronous browser dialog. When called inside an async React Flow callback,
the timing can cause React Flow to have already committed the node removal from
canvas before the server call completes. If the server call fails, the reload
restores the node — which looks like "resurrection" even on success due to the
`!optimistic` branch not updating state fast enough.

### Fix
In `removeNodesByIds` in `WorkflowEditor.tsx`:
1. Always use `optimistic: true` from `onNodesDelete` (keyboard path).
2. Remove the `confirm()` from `onBeforeDelete` for keyboard deletes — React
   Flow already shows the node disappearing instantly. Confirm dialogs on
   keyboard shortcuts are bad UX. Keep confirm only in the menu "Удалить" path.

```tsx
// WorkflowEditor.tsx

const onBeforeDelete = useCallback(
  async ({ nodes: toRemove }: { nodes: Node[]; edges: Edge[] }) => {
    // Allow keyboard deletion without confirm dialog
    // Menu-based deletion has its own confirm in onDeleteNode
    return toRemove.length > 0;
  },
  []
);

const onNodesDelete = useCallback(
  (deleted: Node[]) => {
    const ids = deleted.map((n) => n.id);
    void removeNodesByIds(ids, { optimistic: true }); // always optimistic
  },
  [removeNodesByIds]
);

// Keep confirm only in menu path:
const onDeleteNode = useCallback(
  (id: string) => {
    if (!confirm("Удалить узел?")) return;
    void removeNodesByIds([id], { optimistic: true });
  },
  [removeNodesByIds]
);
```

---

## SECTION 4 — BUG: duplicate "Сохранить" button in config panel

### Root cause
`NodeConfigPanel.tsx` renders a "Сохранить" button in the sticky footer of the
"Настройка" tab. Every individual config form (`TelegramConfig`,
`HttpActionConfig`, `WebhookConfig`, etc.) ALSO renders its own "Сохранить"
button at the bottom of the form. Result: two stacked "Сохранить" buttons.

### Fix
**Remove the footer button from `NodeConfigPanel.tsx`** (the outer panel wrapper).
Let each config form own its single save action.

```tsx
// NodeConfigPanel.tsx — TabsContent value="config"
// REMOVE this entire block:
<div className="shrink-0 border-t border-border bg-card p-3">
  <Button type="button" className="w-full" onClick={handleDone}>
    Сохранить
  </Button>
</div>
```

The `handleDone` function (`onSaved(); onClose()`) is still needed — wire it
to the config forms' `onSaved` callback: when a config form explicitly saves
(user clicks its own "Сохранить"), the panel should close. Currently `onSaved`
in the panel just calls the parent `reload()`. Change the panel's `onSaved`
prop to `onSaved` = close panel AND reload:

```tsx
// NodeConfigPanel.tsx
// Change: when child calls onSaved, close the panel
export function NodeConfigPanel({ ..., onClose, onSaved }) {
  const handleChildSaved = () => {
    onSaved();  // triggers reload in parent
    onClose();  // closes panel
  };
  // Pass handleChildSaved to all config components instead of onSaved
}
```

---

## SECTION 5 — PERFORMANCE: autosave spam triggers full workflow reload

### Root cause
All config components (`TelegramConfig`, `HttpActionConfig`, `EmailActionConfig`,
`EmailTriggerConfig`, `DbActionConfig`, `TransformConfig`, `ScheduleConfig`,
`WebhookConfig`) use a `useEffect` with 500ms debounce that:
1. PATCHes node config ✅ correct
2. Calls `onSaved()` ❌ which triggers `reload()` = full GET /api/workflows/:id
   = 3 Prisma queries per every 500ms of typing

### Fix — apply to ALL 8 config components

**Rule: autosave useEffect must NEVER call `onSaved()`.**

```ts
// In every config component — the debounced useEffect:
useEffect(() => {
  const t = setTimeout(() => {
    const cfg = safeDebouncedConfig(debounceKey, schema);
    if (!cfg) return;
    void patchNode(nodeId, { config: cfg });
    // DO NOT call onSaved() here — remove it
  }, 500);
  return () => clearTimeout(t);
}, [debounceKey, nodeId]); // remove onSaved from dependency array

// Only call onSaved() in the explicit submit handler:
const saveNow = handleSubmit(async (data) => {
  await patchNode(nodeId, { config: data });
  onSaved(); // this is the only place
});
```

Apply this change to all 8 files in `components/editor/config/`.

---

## SECTION 6 — DARK THEME: eye-straining, low contrast

### Root cause
The dark theme CSS variables produce a very narrow contrast range:
- `--background: 222 47% 6%` (near black)
- `--card: 222 47% 9%` (barely lighter)
- `--border: 216 34% 17%` (very dark, nearly invisible)

Cards are indistinguishable from background. Text on dark canvas is hard to
read. The brand orange `#FF4A00` on near-black is extremely high contrast and
vibrating.

### Fix
In `app/globals.css`, replace the `.dark` block with a softer, more legible
dark theme:

```css
.dark {
  --background: 220 16% 14%;        /* #1e2130 — warm dark slate, not pure black */
  --foreground: 220 14% 90%;        /* near-white, slightly warm */
  --canvas: 220 16% 12%;            /* slightly darker for canvas area */
  --card: 220 16% 18%;              /* clearly lighter than background */
  --card-foreground: 220 14% 90%;
  --popover: 220 16% 20%;
  --popover-foreground: 220 14% 90%;
  --primary: 17 90% 56%;            /* slightly desaturated orange — less jarring */
  --primary-foreground: 0 0% 100%;
  --secondary: 220 16% 22%;
  --secondary-foreground: 220 14% 80%;
  --muted: 220 16% 22%;
  --muted-foreground: 220 10% 55%;  /* clearly readable */
  --accent: 220 16% 24%;
  --accent-foreground: 220 14% 90%;
  --destructive: 0 72% 55%;
  --destructive-foreground: 0 0% 100%;
  --border: 220 16% 26%;            /* visible but not harsh */
  --input: 220 16% 24%;
  --ring: 17 90% 56%;
  --success: 160 70% 40%;
  --success-foreground: 0 0% 100%;
  --warning: 38 85% 52%;
  --warning-foreground: 220 16% 14%;
  --brand-purple: 263 60% 68%;      /* slightly lighter purple for dark bg */
  --sidebar-active-bg: 17 40% 22%; /* muted orange tint, not screaming */
}
```

Also in the `body` rule, remove the hardcoded `color: #374151` (light theme
hex) and use the CSS variable instead:

```css
body {
  @apply bg-background text-foreground antialiased;
  font-size: 14px;
  /* REMOVE: color: #374151; — this overrides dark theme foreground */
}
```

Same for `.page-title` — replace `color: #111827` with `color: hsl(var(--foreground))`:

```css
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: hsl(var(--foreground)); /* was #111827 — breaks dark mode */
}
.section-label {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: hsl(var(--muted-foreground)); /* was #6b7280 — breaks dark mode */
}
```

---

## SECTION 7 — UX: EditorTopBar "Сохранить" button is confusing

### Root cause
The top bar has three action buttons: "Тестовый запуск", "Опубликовать/Остановить",
and "Сохранить". The last one only saves the workflow **name** (calls PATCH name).
Users expect "Сохранить" in an editor to save everything. The naming is misleading.

### Fix
1. Rename the "Сохранить" button to **"Сохранить название"** — OR better:
   remove it as a standalone button and make name saving fully implicit
   (already happens on blur/Enter when editing). Keep only the `Ctrl+S`
   shortcut.

2. Since the name already auto-saves on blur/Enter, the standalone save button
   is redundant. Remove it:

```tsx
// EditorTopBar.tsx — REMOVE this button block entirely:
<Button
  variant="ghost"
  size="sm"
  disabled={saveState === "saving"}
  onClick={() => void saveName()}
  className="hidden md:inline-flex"
>
  ...Сохранить...
</Button>
```

3. Keep the `saveState` logic for the `Ctrl+S` shortcut and the inline name
   input — just remove the visible button. If you want to show save feedback,
   add a small "✓ Сохранено" text near the name input that appears briefly
   after saving, then fades out.

---

## SECTION 8 — UX: canvas + node interaction rough edges

### 8.1 Node menu icon hidden behind opacity-0

Both `TriggerNode` and `ActionNode` hide the three-dot menu in a
`opacity-0 group-hover:opacity-100` wrapper. This means:
- The menu is invisible until hover, which is fine for mouse.
- But on touch or when the node is selected (focused), the menu stays hidden.

**Fix**: when node is `selected`, also show the menu:

```tsx
// In both node components — the wrapper div around DropdownMenu:
<div className={cn(
  "opacity-0 transition-opacity group-hover:opacity-100",
  selected && "opacity-100"  // ADD: always visible when selected
)}>
  <DropdownMenu>...
```

### 8.2 Node card click vs. handle click conflict

Currently `react-flow__handle` has `pointer-events: auto !important` via globals.css
override. This is needed for connections. But the node card `onClick` fires even
when user clicks on the handle area. Verify: clicking the handle circles should
start a connection drag, NOT open the config panel.

**Fix**: stop propagation on handle mousedown to prevent `onClick` on the
node from firing when user intends to drag a connection:

If issues persist, add to globals.css:

```css
.react-flow__node .react-flow__handle {
  pointer-events: auto !important;
}
/* Prevent handle click from propagating to node card */
.react-flow__handle {
  z-index: 10;
}
```

And in TriggerNode/ActionNode, change the outer `onClick` to only fire if the
event target is not a handle:

```tsx
onClick={(e) => {
  // Don't open config when clicking connection handles
  if ((e.target as HTMLElement).closest('.react-flow__handle')) return;
  d.onSelect();
}}
```

### 8.3 "Добавить шаг" button position

The "+ Добавить шаг" button sits at `absolute bottom-4 left-1/2` which means
it floats over the canvas. When there are many nodes and the user has scrolled
the canvas, the button always appears at the bottom of the viewport but
potentially over existing nodes.

**Fix**: move this button outside the canvas (below the `ReactFlow` component)
or make it part of the bottom toolbar. It should not float over nodes.
Alternatively, place it only below the last node via a custom bottom "add step"
node or edge endpoint.

Simplest fix: place the button in a non-overlapping area:

```tsx
// WorkflowEditor.tsx — restructure the canvas wrapper
<div className="relative flex min-h-0 flex-1 flex-col bg-canvas">
  <div className="relative min-h-0 flex-1">
    <ReactFlow ... />
    {/* settings panel, etc. */}
  </div>
  {/* Button BELOW the canvas, not overlapping it */}
  {hasTrigger && (
    <div className="flex shrink-0 items-center justify-center border-t border-border bg-card py-2">
      <Button variant="outline" size="sm" onClick={() => openPicker()}>
        + Добавить шаг
      </Button>
    </div>
  )}
  {!hasTrigger && (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <Button className="pointer-events-auto" onClick={() => openPicker()}>
        Добавить триггер
      </Button>
    </div>
  )}
</div>
```

---

## SECTION 9 — UX: workflows dashboard small fixes

### 9.1 Status filter dead button ("Фильтры")
In `WorkflowList.tsx`, there is a "Фильтры" button with funnel icon that does
nothing. Either:
- Add a simple filter dropdown (by trigger type: Webhook / Schedule / Email).
- Or remove the button.

Do not leave a visually prominent button that does nothing.

### 9.2 "Дублировать" in workflow row actions
If there is a "Дублировать" item in the workflow row actions menu that calls
no real API, either implement it or remove it. The duplicate endpoint would
be `POST /api/workflows/:id/duplicate` — if it doesn't exist on the backend,
remove the menu item from the UI.

### 9.3 Relative timestamps on workflow list
Ensure the "Последнее изменение" column uses a proper relative format.
Do NOT use `new Date().toLocaleDateString()` — use a small helper:

```ts
// lib/relative-time.ts
export function relativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "только что";
  if (mins < 60) return `${mins} мин. назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч. назад`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days} д. назад`;
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}
```

Use this in the workflow table row's last-modified column.

---

## SECTION 10 — UX: run history and analytics small fixes

### 10.1 Run status badges
Ensure all status badges use consistent Russian labels:
- `SUCCESS` → "Успех" (green)
- `FAILED` / `ERROR` → "Ошибка" (red)
- `RUNNING` → "Выполняется" (blue/orange, animated pulse dot)
- `PENDING` → "В очереди" (gray)

These must be consistent across: run history table, per-run detail view,
node status dots in the editor, and analytics error list.

### 10.2 Analytics charts tooltips
Verify that all recharts `<LineChart>` and `<BarChart>` components include
`<Tooltip />` with a Russian formatter:

```tsx
<Tooltip
  formatter={(value: number) => [`${value} запусков`, ""]}
  labelFormatter={(label) => `Дата: ${label}`}
/>
```

### 10.3 Empty analytics state
When there are no runs yet, analytics shows empty charts. Add a clear empty
state message: "Нет данных за выбранный период. Опубликуйте Zap и запустите
его, чтобы увидеть статистику."

---

## SECTION 11 — CODE QUALITY: remove console noise

Search the entire `components/` and `app/` directories for:
- `console.log(`
- `console.error(`
- `console.warn(`

Remove all of them that are development debugging artifacts. Keep ONLY
intentional error logging (e.g. in catch blocks where you cannot show
a toast — these should be rare).

---

## SECTION 12 — IMPLEMENTATION ORDER

Work in this exact order to avoid regressions:

1. `app/globals.css` — dark theme variables + remove hardcoded light colors
2. `components/editor/NodePicker.tsx` — remove trigger gate
3. `components/editor/nodes/TriggerNode.tsx` — uncontrolled dropdown + selected visibility
4. `components/editor/nodes/ActionNode.tsx` — same as TriggerNode
5. `components/editor/WorkflowEditor.tsx` — fix onBeforeDelete/onNodesDelete, fix "Добавить шаг" button position
6. `components/editor/NodeConfigPanel.tsx` — remove footer save button, wire handleChildSaved
7. All 8 files in `components/editor/config/` — remove onSaved() from autosave useEffect
8. `components/editor/EditorTopBar.tsx` — remove redundant "Сохранить" button
9. `lib/relative-time.ts` — add helper
10. `components/workflows/WorkflowList.tsx` — fix filter button, relative timestamps
11. `components/runs/` and `components/analytics/` — status badges, tooltips, empty states
12. Global pass: remove console.log noise
13. `npm run lint && npm run build` — fix all errors

---

## FINAL ACCEPTANCE CRITERIA

Before marking done, manually verify:

- [ ] Can add Webhook trigger → then add Schedule trigger in same workflow
- [ ] Three-dot menu opens on first click on any node
- [ ] Pressing Delete/Backspace on selected node removes it from DB (does NOT come back on page reload)
- [ ] Only ONE "Сохранить" visible per config form, no duplicate
- [ ] Typing in Telegram config does NOT flood the network tab with GET /api/workflows requests
- [ ] Dark theme looks clean: cards are visibly distinct from background, text is legible
- [ ] "Фильтры" button either works or is removed
- [ ] `npm run build` exits 0 with no TypeScript errors
```

Этот файл охватывает **12 секций** с точными указаниями по файлам, строкам и причинам каждой проблемы — от критических багов до тёмной темы и спама запросов. Положи его в репо как `prompt-final-audit.md` и прогони через Cursor целиком.
