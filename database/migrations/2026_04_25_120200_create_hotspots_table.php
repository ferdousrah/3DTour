<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotspots', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained('tours')->cascadeOnDelete();
            $table->string('title', 200);
            $table->text('description')->nullable();
            $table->json('position');
            $table->json('normal')->nullable();
            $table->enum('type', ['info', 'product', 'link'])->default('info');
            $table->decimal('price_bdt', 12, 2)->nullable();
            $table->string('external_url', 500)->nullable();
            $table->string('icon', 50)->default('info');
            $table->string('color', 7)->default('#2C4F7D');
            $table->unsignedInteger('display_order')->default(0);
            $table->boolean('is_visible')->default(true);
            $table->timestamps();

            $table->index(['tour_id', 'is_visible'], 'idx_tour_visible');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotspots');
    }
};
