<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('waypoints', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained('tours')->cascadeOnDelete();
            $table->string('label', 120);
            $table->json('position');
            $table->json('look_at');
            $table->unsignedInteger('display_order')->default(0);
            $table->unsignedInteger('transition_ms')->default(1200);
            $table->string('thumbnail_url', 500)->nullable();
            $table->timestamps();

            $table->index(['tour_id', 'display_order'], 'idx_tour_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('waypoints');
    }
};
