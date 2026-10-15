# TaskFlow — Collaborative Multi-User Task Management Platform

A high-performance, multi-user task management application featuring drag-and-drop Kanban workflow organization, recurring reminders, category and priority taxonomies, instant manager-to-member notifications, and a modular, centralized API client architecture designed for seamless scalability and cross-device synchronization.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences have been confirmed from Phase 1 clarification:
> - **Primary Layout & Drag-and-Drop Workflow**: Interactive Kanban board organized by status columns (`To Do`, `In Progress`, `In Review`, `Completed`) with fluid drag-and-drop card movement and quick status transitions.
> - **Notification Architecture**: In-app notification center bell with dynamic unread badge count, real-time toast alert popups, and detailed notification history (task assignments, due dates, reminder alerts).
> - **Visual Aesthetic**: Clean modern minimalist light mode featuring crisp 1px borders, airy slate backgrounds (`#F8FAFC` to `#FFFFFF`), high-contrast typography, and purposeful semantic color accents adhering to universal design rules.

---

## 1. Overview & Core Concept

- **What It Does**: TaskFlow enables managers, team leaders, and individual contributors to create, organize, assign, filter, and track complex task pipelines. Tasks support rich attributes: category groups (Engineering, Design, Operations, Marketing, General), priority levels (Urgent, High, Medium, Low), due dates, recurrence cadences (Daily, Weekly, Monthly), checklists, and assigned collaborators.
- **Target Audience / Persona**: Engineering managers, cross-functional project leads, and team members who need unified task transparency, automated recurring reminder schedules, and instantaneous assignment feedback.
- **Key Value**: Eliminates lost tasks and coordination overhead by pairing an intuitive drag-and-drop spatial board with an immediate notification dispatch engine and a clean, centralized API architecture ready for enterprise extension.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Authentication & Session Onboarding**:
   - Clean, focused light-mode authentication view allowing users to register, sign in, switch demo accounts (Manager persona vs. Team Member personas), and maintain persistent session credentials.
2. **Dashboard & Board Viewport**:
   - Header bar with search input, label/category filter chips, date range presets (Today, This Week, Overdue, All), notification bell with unread indicator, and "+ New Task" modal trigger.
   - 4-column Kanban board (`To Do`, `In Progress`, `In Review`, `Completed`). Each column displays card counts and allows direct drag-and-drop card drops to change task state instantly.
3. **Task Creation & Editing Modal**:
   - Fields: Title, rich description, category selector, priority level, due date and time, recurrence frequency (None, Daily, Weekly, Monthly), assignee selector with team avatars, checklist subtasks, and reminder alerts.
4. **Manager Assignment & Notification Trigger**:
   - When a manager assigns or updates a task for another team member, the system instantly logs a notification event, fires a visible toast banner for the active session, updates the notification bell badge, and syncs to the team member's notification inbox.
5. **Search & Multi-Facet Filtering**:
   - Unified search bar supporting instant keystroke filtering by task title, description, category tag, priority tier, and due date horizon.

### Visual Identity & Theme

- **Aesthetic Direction**: Contemporary SaaS productivity dashboard inspired by linear modern tools. Strict light mode design with zero generic "AI slop" elements (no purple neon gradients, no arbitrary pill enclosures, no decorative status dots).
- **Color Palette & Mood**:
  - `Canvas Canvas`: `#F8FAFC` (Slate-50) for outer backdrop
  - `Surface Panels`: `#FFFFFF` (Pure white) for columns, cards, and modal surfaces with subtle hairline border `#E2E8F0` (Slate-200)
  - `Typography`: Deep slate `#0F172A` (Slate-900) for primary text, `#64748B` (Slate-500) for metadata
  - `Accents & Priorities`:
    - Urgent: Crimson `#DC2626`
    - High: Amber `#D97706`
    - Medium: Blue `#2563EB`
    - Low: Slate `#64748B`
  - `Brand Accent`: Cobalt `#2563EB` for primary action buttons and active selection highlights
- **Typography & Hierarchy**:
  - Display & Headings: `Plus Jakarta Sans`, font weights 600–700 with letter-spacing `-0.02em`
  - Body & Form Controls: `DM Sans` / `Plus Jakarta Sans` font weights 400–500
  - Timestamps, Counters & Due Dates: Strict monospace tabular numerals (`tabular-nums font-mono`)
- **Metadata Discipline**:
  - Categories and metadata are rendered as clean, unboxed text with subtle typographic separators (`·` or `/`), completely avoiding noisy stacked pill badges.

### Interactive Feedback & Motion

- **Drag-and-Drop Interaction**: Native HTML5 Drag and Drop with visual drop target guides, subtle card elevation and opacity shift (`opacity-60 scale-[1.02]`), and smooth reordering.
- **Toasts & Micro-Interactions**: Bounded 200ms transition curves for modal dialogs, bell popovers, and status shifts. Toasts auto-dismiss after 4 seconds with manual close affordance.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Drag-and-Drop Kanban Board Implementation
- **Chosen Approach**: Robust native HTML5 Drag and Drop event handlers (`onDragStart`, `onDragOver`, `onDragLeave`, `onDrop`) coupled with optimistic state updates.
- **Why**: Zero external heavyweight dependencies, flawless mobile and desktop responsiveness, and instant status transitions without layout jitter.
- **Alternatives Considered**: Complex drag-and-drop libraries that bloat bundle size and introduce compatibility friction with React 19.

### Decision 2: Centralized API Client Architecture
- **Chosen Approach**: A structured `/src/api` service module (`client.ts`, `tasks.ts`, `auth.ts`, `notifications.ts`, `users.ts`) exposing clean asynchronous methods with unified error handling, type validation, local persistence caching, and cloud sync readiness.
- **Why**: Directly addresses the user requirement: *"Centralize API calls, so I can easily add and edit new endpoints as the project scales."* Any new backend route or endpoint can be registered in a single central config file without touching UI components.
- **Alternatives Considered**: Inline `fetch` calls scattered across React components, which creates unmaintainable coupling and fragile endpoint management.

### Decision 3: Multi-User Collaboration & Instant Notifications
- **Chosen Approach**: Multi-user account store with role demarcation (`manager` vs `member`), persistent user directory, and an event-driven notification dispatch pipeline. When a task assignment occurs, a typed notification document is created and broadcast to the target user with live audio-visual toasts and persistent bell unread counts.
- **Why**: Delivers genuine multi-device and multi-user workflow dynamics where switching active users or signing into multiple accounts simulates real team coordination.
- **Alternatives Considered**: Generic single-user mock alerts that do not differentiate between who created the task and who received the assignment.

### Decision 4: Recurring Reminders Engine
- **Chosen Approach**: Automated recurrence scheduler evaluating due dates and recurrence patterns (`daily`, `weekly`, `monthly`). Upon task completion or due trigger, the system can automatically schedule the next occurrence and emit due-reminder notifications.
- **Why**: Solves recurring task fatigue for agile sprint rituals, regular maintenance, and recurring operational reviews.

---

## 4. Technical Architecture & Data Strategy

### Architecture & Component Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                          TaskFlow Web Client                           │
│                                                                        │
│   ┌────────────────────────────────────────────────────────────────┐   │
│   │ Top Bar: Brand, Search Bar, Date Filters, Bell, User Profile  │   │
│   └───────────────────────────────┬────────────────────────────────┘   │
│                                   │                                    │
│   ┌───────────────────────────────▼────────────────────────────────┐   │
│   │ Kanban Board Viewport: Drag & Drop Status Columns              │   │
│   │  ┌───────────┐  ┌─────────────┐  ┌────────────┐  ┌───────────┐ │   │
│   │  │   To Do   │  │ In Progress │  │ In Review  │  │ Completed │ │   │
│   │  │ ┌───────┐ │  │  ┌───────┐  │  │  ┌───────┐ │  │ ┌───────┐ │ │   │
│   │  │ │ Task  │ │  │  │ Task  │  │  │  │ Task  │ │  │ │ Task  │ │ │   │
│   │  │ └───────┘ │  │  └───────┘  │  │  └───────┘ │  │ └───────┘ │ │   │
│   │  └─────┬─────┘  └──────┬──────┘  └─────┬──────┘  └─────┬─────┘ │   │
│   └────────┼───────────────┼───────────────┼───────────────┼───────┘   │
│            │               │ Drag-and-Drop │               │           │
│   ┌────────▼───────────────▼───────────────▼───────────────▼───────┐   │
│   │ Modals & Overlays: Task Editor Modal, Notification Tray Popover│   │
│   └───────────────────────────────┬────────────────────────────────┘   │
└───────────────────────────────────┼────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Centralized API Layer (`src/api/`)                   │
│                                                                        │
│   ┌────────────────┐ ┌────────────────┐ ┌───────────────────────────┐  │
│   │  authApi.ts    │ │  tasksApi.ts   │ │  notificationsApi.ts      │  │
│   └────────┬───────┘ └────────┬───────┘ └─────────────┬─────────────┘  │
│            └──────────────────┼───────────────────────┘                │
│                               ▼                                        │
│                 ┌──────────────────────────┐                           │
│                 │      api/client.ts       │                           │
│                 │  (Central Request Bus,   │                           │
│                 │   Auth Header Injector,  │                           │
│                 │   Sync & Cache Engine)   │                           │
│                 └─────────────┬────────────┘                           │
└───────────────────────────────┼────────────────────────────────────────┘
                                │
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│               Data Persistence & Sync Backend Pipeline                 │
│  - Real-time Cloud Storage & Local Cache Fallback                      │
│  - Multi-user profiles, Task Collections, Notification Queues          │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Model & Entities

```typescript
// Core Data Entities

export type TaskStatus = 'todo' | 'in_progress' | 'in_review' | 'completed';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';
export type TaskCategory = 'Engineering' | 'Design' | 'Marketing' | 'Operations' | 'General';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'member';
  avatarUrl?: string;
  department?: string;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  assigneeId: string;
  creatorId: string;
  dueDate: string; // ISO date string
  dueTime?: string;
  recurrence: RecurrenceType;
  reminderMinutesBefore?: number;
  subtasks: Subtask[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  senderId: string;
  taskId: string;
  taskTitle: string;
  type: 'assignment' | 'status_change' | 'due_reminder' | 'comment';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface FilterState {
  searchQuery: string;
  category: string | 'all';
  priority: string | 'all';
  dateFilter: 'all' | 'today' | 'this_week' | 'overdue';
  assigneeId: string | 'all';
}
```

### Interactive Component & State Mapping

1. **`KanbanBoard` & `KanbanColumn`**:
   - Manages dragged task transfer between columns.
   - Updates task status via `api.tasks.updateStatus(taskId, newStatus)`.
   - Re-evaluates column counters and empty states.
2. **`TaskCard`**:
   - Displays priority indicator, category name, title, subtask progress count, assignee avatar, and due date with overdue warning highlighting.
   - Drag handle affordance with grab cursor.
   - Click to open comprehensive `TaskModal` for editing or deletion.
3. **`TaskModal`**:
   - Controlled form supporting task creation and full editing.
   - Detects if active user is a manager assigning a different team member; triggers `api.notifications.create(...)` on save.
   - Manages recurring reminder intervals and checklist items.
4. **`NotificationBell` & `NotificationPopover`**:
   - Displays unread counter badge.
   - On click, drops down list of user-specific notifications with time ago stamps (`5m ago`, `1h ago`).
   - "Mark all as read" button and click-to-view associated task.
5. **`FilterToolbar`**:
   - Real-time search query input with clear button.
   - Category selector dropdown and priority selector dropdown.
   - Date range selector pills (`Today`, `This Week`, `Overdue`, `All`).
6. **`AuthModal` / `UserSwitcher`**:
   - Login, registration, and quick-toggle between Manager (e.g. "Alex Morgan - Engineering Lead") and Team Members (e.g. "Sarah Chen - Frontend Engineer", "Marcus Vance - Product Designer") to immediately test multi-user assignment and live notification receipts.
