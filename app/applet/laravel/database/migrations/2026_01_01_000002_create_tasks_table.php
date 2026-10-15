<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
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

            // Indexes for fast multi-tenant querying & filtering
            $table->index(['status', 'due_date']);
            $table->index('assignee_id');
            $table->index('priority');
            $table->index('category');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
