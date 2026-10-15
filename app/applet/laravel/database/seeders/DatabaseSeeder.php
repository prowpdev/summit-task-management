<?php

namespace Database\Seeders;

use App\Models\Notification;
use App\Models\Subtask;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with demo team members and initial task pipeline.
     */
    public function run(): void
    {
        // 1. Seed Users (Managers & Team Members)
        $manager = User::create([
            'name' => 'Alex Morgan',
            'email' => 'alex.morgan@taskflow.dev',
            'password' => Hash::make('password123'),
            'role' => 'manager',
            'department' => 'Engineering Leadership',
            'title' => 'Engineering Director',
            'avatar_url' => 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
        ]);

        $sarah = User::create([
            'name' => 'Sarah Chen',
            'email' => 'sarah.chen@taskflow.dev',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'department' => 'Frontend Engineering',
            'title' => 'Staff UI Engineer',
            'avatar_url' => 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
        ]);

        $marcus = User::create([
            'name' => 'Marcus Vance',
            'email' => 'marcus.vance@taskflow.dev',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'department' => 'Product Design',
            'title' => 'Lead Design Systems',
            'avatar_url' => 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
        ]);

        $elena = User::create([
            'name' => 'Elena Rostova',
            'email' => 'elena.rostova@taskflow.dev',
            'password' => Hash::make('password123'),
            'role' => 'member',
            'department' => 'Core Infrastructure',
            'title' => 'Senior Distributed Engineer',
            'avatar_url' => 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80',
        ]);

        // 2. Seed Tasks with Checklist Subtasks
        $task1 = Task::create([
            'title' => 'Audit client API payload caching & rate limiters',
            'description' => 'Review endpoint serialization layers and implement token-bucket throttling for high-throughput client polling.',
            'status' => 'in_progress',
            'priority' => 'urgent',
            'category' => 'Engineering',
            'assignee_id' => $sarah->id,
            'creator_id' => $manager->id,
            'due_date' => Carbon::today()->toDateString(),
            'due_time' => '17:00',
            'recurrence' => 'weekly',
            'reminder_minutes_before' => 60,
            'tags' => ['API', 'Security', 'Performance'],
        ]);

        $task1->subtasks()->createMany([
            ['title' => 'Profile request payloads in development', 'completed' => true],
            ['title' => 'Verify authorization token header injection', 'completed' => true],
            ['title' => 'Benchmark memory overhead under concurrency', 'completed' => false],
        ]);

        $task2 = Task::create([
            'title' => 'Design token audit for light mode contrast ratios',
            'description' => 'Ensure all card backgrounds, text kickers, and priority labels meet strict WCAG AA 4.5:1 legibility ratios.',
            'status' => 'todo',
            'priority' => 'high',
            'category' => 'Design',
            'assignee_id' => $marcus->id,
            'creator_id' => $manager->id,
            'due_date' => Carbon::tomorrow()->toDateString(),
            'due_time' => '14:30',
            'recurrence' => 'none',
            'reminder_minutes_before' => 30,
            'tags' => ['Design System', 'Accessibility'],
        ]);

        $task2->subtasks()->createMany([
            ['title' => 'Check Slate-500 against white card surfaces', 'completed' => true],
            ['title' => 'Validate priority border and text badges', 'completed' => false],
        ]);

        $task3 = Task::create([
            'title' => 'Weekly team engineering sync & retrospective',
            'description' => 'Recurring weekly touchpoint to review completed assignments, eliminate roadblocks, and plan next sprint backlog.',
            'status' => 'todo',
            'priority' => 'medium',
            'category' => 'General',
            'assignee_id' => $manager->id,
            'creator_id' => $manager->id,
            'due_date' => Carbon::today()->addDays(2)->toDateString(),
            'due_time' => '10:00',
            'recurrence' => 'weekly',
            'reminder_minutes_before' => 15,
            'tags' => ['Sync', 'Weekly'],
        ]);

        // 3. Seed Notifications
        Notification::create([
            'user_id' => $sarah->id,
            'sender_id' => $manager->id,
            'task_id' => $task1->id,
            'type' => 'assignment',
            'message' => 'Alex Morgan (Manager) assigned you a task: "Audit client API payload caching & rate limiters"',
            'read' => false,
        ]);

        Notification::create([
            'user_id' => $marcus->id,
            'sender_id' => $manager->id,
            'task_id' => $task2->id,
            'type' => 'assignment',
            'message' => 'Alex Morgan (Manager) assigned you a task: "Design token audit for light mode contrast ratios"',
            'read' => false,
        ]);
    }
}
