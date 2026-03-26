<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('alerts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->foreignId('station_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->string('metric', 50);
            $table->enum('operator', ['gt', 'lt', 'gte', 'lte', 'eq']);
            $table->decimal('threshold', 12, 4);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_triggered_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'is_active'], 'user_active_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alerts');
    }
};