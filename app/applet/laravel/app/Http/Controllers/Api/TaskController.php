<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Subtask;
use App\Models\Task;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TaskController extends Controller
{
    /**
     * Display a listing of tasks with multi-facet filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Task::with(['assignee', 'creator', 'subtasks']);

        // Search filter
        if ($request->filled('q')) {
            $searchTerm = '%' . strtolower($request->query('q')) . '%';
            $query->where(function ($q) use ($searchTerm) {
                $q->whereRaw('LOWER(title) LIKE ?', [$searchTerm])
                  ->orWhereRaw('LOWER(description) LIKE ?', [$searchTerm]);
            });
        }

        // Category filter
        if ($request->filled('category') && $request->query('category') !== 'all') {
            $query->where('category', $request->query('category'));
        }

        // Priority filter
        if ($request->filled('priority') && $request->query('priority') !== 'all') {
            $query->where('priority', $request->query('priority'));
        }

        // Assignee filter
        if ($request->filled('assigneeId') && $request->query('assigneeId') !== 'all') {
            $query->where('assignee_id', $request->query('assigneeId'));
        }

        // Date horizon filter
        if ($request->filled('dateFilter') && $request->query('dateFilter') !== 'all') {
            $today = Carbon::today()->toDateString();
            $filter = $request->query('dateFilter');

            if ($filter === 'today') {
                $query->whereDate('due_date', $today);
            } elseif ($filter === 'this_week') {
                $startOfWeek = Carbon::now()->startOfWeek()->toDateString();
                $endOfWeek = Carbon::now()->endOfWeek()->toDateString();
                $query->whereBetween('due_date', [$startOfWeek, $endOfWeek]);
            } elseif ($filter === 'overdue') {
                $query->where('status', '!=', 'completed')
                      ->whereDate('due_date', '<', $today);
            }
        }

        $tasks = $query->latest('updated_at')->get();

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);
    }

    /**
     * Store a newly created task.
     * Dispatches immediate notification if manager assigns to team member.
     */
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
            'subtasks.*.title' => 'required|string|max:255',
        ]);

        $currentUser = $request->user();
        $creatorId = $currentUser ? $currentUser->id : ($request->input('creator_id') ?: $validated['assignee_id']);

        $task = DB::transaction(function () use ($validated, $creatorId, $request, $currentUser) {
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

            // Create subtasks if provided
            if (!empty($validated['subtasks'])) {
                foreach ($validated['subtasks'] as $subItem) {
                    $task->subtasks()->create([
                        'title' => $subItem['title'],
                        'completed' => $subItem['completed'] ?? false,
                    ]);
                }
            }

            // Multi-user notification trigger:
            // If creator assigns someone else, emit immediate notification!
            if ((int)$validated['assignee_id'] !== (int)$creatorId) {
                $creatorName = $currentUser ? $currentUser->name : 'Manager';
                $creatorRole = ($currentUser && $currentUser->role === 'manager') ? 'Manager' : 'Lead';

                Notification::create([
                    'user_id' => $validated['assignee_id'],
                    'sender_id' => $creatorId,
                    'task_id' => $task->id,
                    'type' => 'assignment',
                    'message' => "{$creatorName} ({$creatorRole}) assigned you a task: \"{$task->title}\"",
                    'read' => false,
                ]);
            }

            return $task->load(['assignee', 'creator', 'subtasks']);
        });

        return response()->json([
            'success' => true,
            'data' => $task,
        ], 201);
    }

    /**
     * Display the specified task.
     */
    public function show(Task $task): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => $task->load(['assignee', 'creator', 'subtasks']),
        ]);
    }

    /**
     * Update the specified task.
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => ['sometimes', Rule::in(['todo', 'in_progress', 'in_review', 'completed'])],
            'priority' => ['sometimes', Rule::in(['urgent', 'high', 'medium', 'low'])],
            'category' => ['sometimes', Rule::in(['Engineering', 'Design', 'Marketing', 'Operations', 'General'])],
            'assignee_id' => 'sometimes|required|exists:users,id',
            'due_date' => 'nullable|date',
            'due_time' => 'nullable|string|max:10',
            'recurrence' => ['sometimes', Rule::in(['none', 'daily', 'weekly', 'monthly'])],
            'reminder_minutes_before' => 'nullable|integer',
            'tags' => 'nullable|array',
            'subtasks' => 'nullable|array',
        ]);

        $oldStatus = $task->status;
        $oldAssigneeId = $task->assignee_id;
        $currentUser = $request->user();

        DB::transaction(function () use ($task, $validated, $oldStatus, $oldAssigneeId, $currentUser) {
            $task->update($validated);

            // Sync subtasks if passed
            if (isset($validated['subtasks'])) {
                $task->subtasks()->delete();
                foreach ($validated['subtasks'] as $subItem) {
                    $task->subtasks()->create([
                        'title' => $subItem['title'],
                        'completed' => $subItem['completed'] ?? false,
                    ]);
                }
            }

            // Recurring task auto-spawn
            if ($oldStatus !== 'completed' && ($validated['status'] ?? null) === 'completed') {
                $task->scheduleNextOccurrence();
            }

            // If assignee changed, dispatch notification to new assignee
            if (isset($validated['assignee_id']) && (int)$validated['assignee_id'] !== (int)$oldAssigneeId) {
                Notification::create([
                    'user_id' => $validated['assignee_id'],
                    'sender_id' => $currentUser ? $currentUser->id : $task->creator_id,
                    'task_id' => $task->id,
                    'type' => 'assignment',
                    'message' => ($currentUser ? $currentUser->name : 'Team Lead') . " assigned you to: \"{$task->title}\"",
                    'read' => false,
                ]);
            }
        });

        return response()->json([
            'success' => true,
            'data' => $task->fresh(['assignee', 'creator', 'subtasks']),
        ]);
    }

    /**
     * Quick status update endpoint (for drag-and-drop Kanban movement).
     */
    public function updateStatus(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', Rule::in(['todo', 'in_progress', 'in_review', 'completed'])],
        ]);

        $oldStatus = $task->status;
        $task->update(['status' => $validated['status']]);

        // Auto-spawn next cycle if newly marked completed
        if ($oldStatus !== 'completed' && $validated['status'] === 'completed') {
            $task->scheduleNextOccurrence();
        }

        return response()->json([
            'success' => true,
            'data' => $task->load(['assignee', 'creator', 'subtasks']),
        ]);
    }

    /**
     * Toggle checklist subtask.
     */
    public function toggleSubtask(Task $task, Subtask $subtask): JsonResponse
    {
        if ($subtask->task_id !== $task->id) {
            return response()->json(['success' => false, 'error' => 'Subtask does not belong to this task'], 400);
        }

        $subtask->update(['completed' => !$subtask->completed]);

        return response()->json([
            'success' => true,
            'data' => $task->fresh(['subtasks']),
        ]);
    }

    /**
     * Remove the specified task.
     */
    public function destroy(Task $task): JsonResponse
    {
        $id = $task->id;
        $task->delete();

        return response()->json([
            'success' => true,
            'data' => ['id' => $id],
            'message' => 'Task deleted successfully',
        ]);
    }
}
