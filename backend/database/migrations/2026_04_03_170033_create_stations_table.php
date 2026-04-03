<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('stations', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->decimal('latitude',  10, 7);
            $table->decimal('longitude', 10, 7);
            $table->string('country', 100);
            $table->string('city',    100);
            $table->enum('type', ['air_quality', 'weather', 'emissions']);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['country', 'type']);
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stations');
    }
};