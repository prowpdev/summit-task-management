import React, { useState } from 'react';
import {
  FileCode,
  FolderTree,
  Copy,
  Check,
  Download,
  Terminal,
  Database,
  Layers,
  Sparkles,
} from 'lucide-react';

interface LaravelFile {
  id: string;
  name: string;
  path: string;
  category: 'Controllers' | 'Models' | 'Migrations' | 'Routes';
  description: string;
  code: string;
}

const LARAVEL_FILES: LaravelFile[] = [
  // Controllers
  {
    id: 'ctrl-task',
    name: 'TaskController.php',
    path: 'app/Http/Controllers/Api/TaskController.php',
    category: 'Controllers',
    description: 'Handles CRUD operations, multi-facet filtering (q, category, priority, dates), recurring automation next-cycle triggers, and manager assignment notifications.',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Notification;
use App\\Models\\Subtask;
use App\\Models\\Task;
use Carbon\\Carbon;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Validation\\Rule;

class TaskController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['assignee', 'creator', 'subtasks']);

        if ($request->filled('q')) {
            $searchTerm = '%' . strtolower($request->query('q')) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(title) LIKE ?', [$searchTerm])
                  ->orWhereRaw('LOWER(description) LIKE ?', [$searchTerm]);
            });
        }

        if ($request->filled('category') && $request->query('category') !== 'all') {
            $query->where('category', $request->query('category'));
        }

        if ($request->filled('priority') && $request->query('priority') !== 'all') {
            $query->where('priority', $request->query('priority'));
        }

        if ($request->filled('assigneeId') && $request->query('assigneeId') !== 'all') {
            $query->where('assignee_id', $request->query('assigneeId'));
        }

        if ($request->filled('dateFilter') && $request->query('dateFilter') !== 'all') {
            $today = Carbon::today()->toDateString();
            $filter = $request->query('dateFilter');

            if ($filter === 'today') {
                $query->whereDate('due_date', $today);
            } elseif ($filter === 'this_week') {
                $query->whereBetween('due_date', [
                    Carbon::now()->startOfWeek()->toDateString(),
                    Carbon::now()->endOfWeek()->toDateString()
                ]);
            } elseif ($filter === 'overdue') {
                $query->where('status', '!=', 'completed')->whereDate('due_date', '<', $today);
            }
        }

        return response()->json([
            'success' => true,
            'data' => $query->latest('updated_at')->get(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['nullable', Rule::in(['todo', 'in_progress', 'in_review', 'completed'])],
            'priority' => ['nullable', Rule::in(['urgent', 'high', 'medium', 'low'])],
            'category' => ['nullable', Rule::in(['Engineering', 'Design', 'Marketing', 'Operations', 'General'])],
            'assignee_id' => 'required|exists:users,id',
            'due_date' => 'nullable|date',
            'due_time' => 'nullable|string|max:10',
            'recurrence' => ['nullable', Rule::in(['none', 'daily', 'weekly', 'monthly'])],
            'reminder_minutes_before' => 'nullable|integer',
            'tags' => 'nullable|array',
            'subtasks' => 'nullable|array',
        ]);

        $currentUser = $request->user();
        $creatorId = $currentUser ? $currentUser->id : ($request->input('creator_id') ?: $validated['assignee_id']);

        $task = DB::transaction(function () use ($validated, $creatorId, $currentUser) {
            $task = Task::create([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'status' => $validated['status'] ?? 'todo',
                'priority' => $validated['priority'] ?? 'medium',
                'category' => $validated['category'] ?? 'General',
                'assignee_id' => $validated['assignee_id'],
                'creator_id' => $creatorId,
                'due_date' => $validated['due_date'] ?? null,
                'due_time' => $validated['due_time'] ?? '17:00',
                'recurrence' => $validated['recurrence'] ?? 'none',
                'reminder_minutes_before' => $validated['reminder_minutes_before'] ?? 30,
                'tags' => $validated['tags'] ?? [],
            ]);

            if (!empty($validated['subtasks'])) {
                foreach ($validated['subtasks'] as $subItem) {
                    $task->subtasks()->create([
                        'title' => $subItem['title'],
                        'completed' => $subItem['completed'] ?? false,
                    ]);
                }
            }

            // Real-time assignment alert to member
            if ((int)$validated['assignee_id'] !== (int)$creatorId) {
                $creatorName = $currentUser ? $currentUser->name : 'Manager';
                Notification::create([
                    'user_id' => $validated['assignee_id'],
                    'sender_id' => $creatorId,
                    'task_id' => $task->id,
                    'type' => 'assignment',
                    'message' => "{$creatorName} assigned you a task: \\"{$task->title}\\"",
                    'read' => false,
                ]);
            }

            return $task->load(['assignee', 'creator', 'subtasks']);
        });

        return response()->json(['success' => true, 'data' => $task], 201);
    }

    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['todo', 'in_progress', 'in_review', 'completed'])],
        ]);

        $oldStatus = $task->status;
        $task->update(['status' => $validated['status']]);

        // Auto-spawn next cycle if recurring
        if ($oldStatus !== 'completed' && $validated['status'] === 'completed') {
            $task->scheduleNextOccurrence();
        }

        return response()->json(['success' => true, 'data' => $task->load(['assignee', 'subtasks'])]);
    }
}`,
  },
  {
    id: 'ctrl-notif',
    name: 'NotificationController.php',
    path: 'app/Http/Controllers/Api/NotificationController.php',
    category: 'Controllers',
    description: 'Manages user notifications, unread counts, and batch mark-all-read operations.',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\Notification;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->query('user_id', 1);

        $notifications = Notification::with(['sender', 'task'])
            ->where('user_id', $userId)
            ->latest()
            ->get();

        return response()->json(['success' => true, 'data' => $notifications]);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->query('user_id', 1);

        $count = Notification::where('user_id', $userId)
            ->where('read', false)
            ->count();

        return response()->json(['success' => true, 'data' => ['count' => $count]]);
    }

    public function markAsRead(Notification $notification): JsonResponse
    {
        $notification->update(['read' => true]);
        return response()->json(['success' => true, 'data' => $notification]);
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        $userId = $request->user() ? $request->user()->id : $request->input('user_id', 1);

        $affected = Notification::where('user_id', $userId)
            ->where('read', false)
            ->update(['read' => true]);

        return response()->json(['success' => true, 'data' => ['count' => $affected]]);
    }
}`,
  },
  {
    id: 'ctrl-auth',
    name: 'AuthController.php',
    path: 'app/Http/Controllers/Api/AuthController.php',
    category: 'Controllers',
    description: 'Laravel Sanctum authentication, token generation, user registration, and demo persona switching.',
    code: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\User;
use Illuminate\\Http\\JsonResponse;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Hash;

class AuthController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'nullable|string|min:6',
            'role' => 'nullable|in:manager,member',
            'department' => 'nullable|string|max:100',
            'title' => 'nullable|string|max:100',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password'] ?? 'password123'),
            'role' => $validated['role'] ?? 'member',
            'department' => $validated['department'] ?? 'Engineering',
            'title' => $validated['title'] ?? 'Software Engineer',
        ]);

        $token = $user->createToken('taskflow_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'data' => ['user' => $user, 'token' => $token],
        ], 201);
    }

    public function login(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email']);
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['success' => false, 'error' => 'User not found'], 401);
        }

        $token = $user->createToken('taskflow_token')->plainTextToken;
        return response()->json(['success' => true, 'data' => ['user' => $user, 'token' => $token]]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => $request->user() ?: User::first()]);
    }
}`,
  },

  // Models
  {
    id: 'model-task',
    name: 'Task.php',
    path: 'app/Models/Task.php',
    category: 'Models',
    description: 'Eloquent model with relations to User (assignee & creator), Subtasks, and automated recurrence scheduler method.',
    code: `<?php

namespace App\\Models;

use Carbon\\Carbon;
use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Model;
use Illuminate\\Database\\Eloquent\\Relations\\BelongsTo;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title', 'description', 'status', 'priority', 'category',
        'assignee_id', 'creator_id', 'due_date', 'due_time',
        'recurrence', 'reminder_minutes_before', 'tags',
    ];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
        'reminder_minutes_before' => 'integer',
        'tags' => 'array',
    ];

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    public function subtasks(): HasMany
    {
        return $this->hasMany(Subtask::class);
    }

    public function scheduleNextOccurrence(): ?self
    {
        if ($this->recurrence === 'none' || !$this->due_date) return null;

        $current = Carbon::parse($this->due_date);
        $nextDate = match ($this->recurrence) {
            'daily' => $current->copy()->addDay(),
            'weekly' => $current->copy()->addWeek(),
            'monthly' => $current->copy()->addMonth(),
            default => null,
        };

        if (!$nextDate) return null;

        $nextTask = self::create([
            'title' => $this->title,
            'description' => $this->description,
            'status' => 'todo',
            'priority' => $this->priority,
            'category' => $this->category,
            'assignee_id' => $this->assignee_id,
            'creator_id' => $this->creator_id,
            'due_date' => $nextDate->toDateString(),
            'due_time' => $this->due_time,
            'recurrence' => $this->recurrence,
            'reminder_minutes_before' => $this->reminder_minutes_before,
            'tags' => $this->tags,
        ]);

        foreach ($this->subtasks as $sub) {
            $nextTask->subtasks()->create(['title' => $sub->title, 'completed' => false]);
        }

        return $nextTask;
    }
}`,
  },
  {
    id: 'model-user',
    name: 'User.php',
    path: 'app/Models/User.php',
    category: 'Models',
    description: 'User model with Sanctum tokens, manager/member role scopes, assigned tasks, and notification feeds.',
    code: `<?php

namespace App\\Models;

use Illuminate\\Database\\Eloquent\\Factories\\HasFactory;
use Illuminate\\Database\\Eloquent\\Relations\\HasMany;
use Illuminate\\Foundation\\Auth\\User as Authenticatable;
use Illuminate\\Notifications\\Notifiable;
use Laravel\\Sanctum\\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name', 'email', 'password', 'role',
        'department', 'title', 'avatar_url',
    ];

    protected $hidden = ['password', 'remember_token'];

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assignee_id');
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'creator_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'user_id')->latest();
    }

    public function isManager(): bool
    {
        return $this->role === 'manager';
    }
}`,
  },

  // Migrations
  {
    id: 'mig-tasks',
    name: '2026_01_01_000002_create_tasks_table.php',
    path: 'database/migrations/2026_01_01_000002_create_tasks_table.php',
    category: 'Migrations',
    description: 'Schema blueprint with indexed foreign keys, enum checks, date horizons, and JSON tags column.',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            $table->enum('status', ['todo', 'in_progress', 'in_review', 'completed'])->default('todo');
            $table->enum('priority', ['urgent', 'high', 'medium', 'low'])->default('medium');
            $table->enum('category', ['Engineering', 'Design', 'Marketing', 'Operations', 'General'])->default('General');
            $table->foreignId('assignee_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('creator_id')->constrained('users')->onDelete('cascade');
            $table->date('due_date')->nullable();
            $table->string('due_time', 10)->default('17:00');
            $table->enum('recurrence', ['none', 'daily', 'weekly', 'monthly'])->default('none');
            $table->unsignedInteger('reminder_minutes_before')->default(30);
            $table->json('tags')->nullable();
            $table->timestamps();

            $table->index(['status', 'due_date']);
            $table->index('assignee_id');
            $table->index('priority');
            $table->index('category');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};`,
  },
  {
    id: 'mig-notifs',
    name: '2026_01_01_000004_create_notifications_table.php',
    path: 'database/migrations/2026_01_01_000004_create_notifications_table.php',
    category: 'Migrations',
    description: 'Schema for team notifications with recipient foreign key and read status index.',
    code: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('sender_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('task_id')->nullable()->constrained('tasks')->onDelete('set null');
            $table->enum('type', ['assignment', 'status_change', 'due_reminder', 'comment'])->default('assignment');
            $table->text('message');
            $table->boolean('read')->default(false);
            $table->timestamps();

            $table->index(['user_id', 'read']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('notifications');
    }
};`,
  },

  // Routes
  {
    id: 'routes-api',
    name: 'api.php',
    path: 'routes/api.php',
    category: 'Routes',
    description: 'REST API routing table matching TaskFlow React client endpoints for tasks, status, subtasks, and notifications.',
    code: `<?php

use App\\Http\\Controllers\\Api\\AuthController;
use App\\Http\\Controllers\\Api\\NotificationController;
use App\\Http\\Controllers\\Api\\TaskController;
use App\\Http\\Controllers\\Api\\UserController;
use Illuminate\\Support\\Facades\\Route;

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/switch-user', [AuthController::class, 'switchUser']);
});

Route::group(['middleware' => ['api']], function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{user}', [UserController::class, 'show']);

    Route::get('/tasks', [TaskController::class, 'index']);
    Route::post('/tasks', [TaskController::class, 'store']);
    Route::get('/tasks/{task}', [TaskController::class, 'show']);
    Route::put('/tasks/{task}', [TaskController::class, 'update']);
    Route::delete('/tasks/{task}', [TaskController::class, 'destroy']);
    Route::put('/tasks/{task}/status', [TaskController::class, 'updateStatus']);
    Route::put('/tasks/{task}/subtasks/{subtask}/toggle', [TaskController::class, 'toggleSubtask']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::put('/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::post('/notifications', [NotificationController::class, 'store']);
});`,
  },
];

export const LaravelExplorerView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Controllers');
  const [selectedFileId, setSelectedFileId] = useState<string>('ctrl-task');
  const [copied, setCopied] = useState(false);

  const categories = ['Controllers', 'Models', 'Migrations', 'Routes'];
  const currentFiles = LARAVEL_FILES.filter((f) => f.category === selectedCategory);
  const activeFile = LARAVEL_FILES.find((f) => f.id === selectedFileId) || LARAVEL_FILES[0];

  const handleCopy = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span className="p-1 rounded bg-rose-50 text-rose-600 font-mono font-black text-xs">
              PHP
            </span>
            <span>Laravel Backend Architecture</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            Full Laravel 11+ backend codebase including REST Controllers, Eloquent Models with relationships, database Migrations, and API routes mirroring the TaskFlow React application.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors shadow-xs"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied Code</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy File</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Category Tabs & File Tree */}
        <div className="lg:col-span-4 space-y-4">
          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  const firstInCat = LARAVEL_FILES.find((f) => f.category === cat);
                  if (firstInCat) setSelectedFileId(firstInCat.id);
                }}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-white text-slate-900 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* File List in Current Category */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
              {selectedCategory} Files ({currentFiles.length})
            </p>
            {currentFiles.map((file) => (
              <button
                key={file.id}
                onClick={() => setSelectedFileId(file.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all text-xs flex flex-col gap-1 ${
                  selectedFileId === file.id
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs'
                    : 'border-transparent hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FileCode
                    className={`w-4 h-4 ${
                      selectedFileId === file.id ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <span className="font-semibold text-slate-900 font-mono text-xs">
                    {file.name}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono truncate pl-6">
                  laravel/{file.path}
                </span>
              </button>
            ))}
          </div>

          {/* Architecture Quick Reference */}
          <div className="bg-slate-900 text-slate-200 rounded-2xl p-4 text-xs font-mono space-y-2">
            <div className="flex items-center gap-1.5 text-blue-400 font-bold border-b border-slate-800 pb-2">
              <Database className="w-4 h-4" />
              <span>Laravel Architecture Summary</span>
            </div>
            <ul className="text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
              <li>
                <strong className="text-white">TaskController</strong>: Full search, status drag-and-drop, automated next-cycle recurring triggers, and manager assignment alerts.
              </li>
              <li>
                <strong className="text-white">Task & User Models</strong>: Bidirectional Eloquent relationships with JSON tags and Carbon date casting.
              </li>
              <li>
                <strong className="text-white">Migrations</strong>: Schema declarations with compound indexes for lightning-fast Kanban queries.
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column: Code Viewer */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex-1 flex flex-col">
            {/* File Path & Description Bar */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-slate-900">
                    laravel/{activeFile.path}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {activeFile.description}
                </p>
              </div>
            </div>

            {/* Syntax Highlighted Code Viewer */}
            <div className="p-4 bg-slate-950 flex-1 overflow-auto max-h-[620px]">
              <pre className="font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto">
                <code>{activeFile.code}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
