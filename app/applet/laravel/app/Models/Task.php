<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'status', // 'todo' | 'in_progress' | 'in_review' | 'completed'
        'priority', // 'urgent' | 'high' | 'medium' | 'low'
        'category', // 'Engineering' | 'Design' | 'Marketing' | 'Operations' | 'General'
        'assignee_id',
        'creator_id',
        'due_date',
        'due_time',
        'recurrence', // 'none' | 'daily' | 'weekly' | 'monthly'
        'reminder_minutes_before',
        'tags',
    ];

    protected $casts = [
        'due_date' => 'date:Y-m-d',
        'reminder_minutes_before' => 'integer',
        'tags' => 'array',
    ];

    /**
     * User assigned to the task.
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /**
     * User who created the task.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_id');
    }

    /**
     * Subtask checklist items.
     */
    public function subtasks(): HasMany
    {
        return $this->hasMany(Subtask::class);
    }

    /**
     * Automatically spawns the next occurrence for recurring tasks upon completion.
     */
    public function scheduleNextOccurrence(): ?self
    {
        if ($this->recurrence === 'none' || !$this->due_date) {
            return null;
        }

        $currentDueDate = Carbon::parse($this->due_date);
        $nextDueDate = match ($this->recurrence) {
            'daily' => $currentDueDate->copy()->addDay(),
            'weekly' => $currentDueDate->copy()->addWeek(),
            'monthly' => $currentDueDate->copy()->addMonth(),
            default => null,
        };

        if (!$nextDueDate) {
            return null;
        }

        $nextTask = self::create([
            'title' => $this->title,
            'description' => $this->description,
            'status' => 'todo',
            'priority' => $this->priority,
            'category' => $this->category,
            'assignee_id' => $this->assignee_id,
            'creator_id' => $this->creator_id,
            'due_date' => $nextDueDate->toDateString(),
            'due_time' => $this->due_time,
            'recurrence' => $this->recurrence,
            'reminder_minutes_before' => $this->reminder_minutes_before,
            'tags' => $this->tags,
        ]);

        // Replicate subtasks in uncompleted state
        foreach ($this->subtasks as $subtask) {
            $nextTask->subtasks()->create([
                'title' => $subtask->title,
                'completed' => false,
            ]);
        }

        return $nextTask;
    }
}
