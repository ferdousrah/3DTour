<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotspot_media', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotspot_id')->constrained('hotspots')->cascadeOnDelete();
            $table->string('file_url', 500);
            $table->string('mime_type', 50);
            $table->string('alt_text', 255)->nullable();
            $table->string('caption', 500)->nullable();
            $table->unsignedInteger('display_order')->default(0);
            $table->timestamps();

            $table->index(['hotspot_id', 'display_order'], 'idx_hotspot_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotspot_media');
    }
};
