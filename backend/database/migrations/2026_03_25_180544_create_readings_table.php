<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('readings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('station_id')
                  ->constrained()
                  ->cascadeOnDelete();
            $table->string('metric', 50);
            $table->decimal('value', 12, 4);
            $table->string('unit',   20);
            $table->timestamp('recorded_at');
            $table->string('source', 100)->nullable();
            $table->timestamps();

            $table->index(['station_id', 'metric', 'recorded_at']);
            $table->unique(
                ['station_id', 'metric', 'recorded_at', 'source'],
                'unique_reading'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('readings');
    }
};