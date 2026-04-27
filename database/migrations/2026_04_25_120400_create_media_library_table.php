<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_library', function (Blueprint $table) {
            $table->id();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->string('file_name', 255);
            $table->string('file_url', 500);
            $table->string('mime_type', 50);
            $table->unsignedBigInteger('file_size');
            $table->unsignedInteger('width')->nullable();
            $table->unsignedInteger('height')->nullable();
            $table->string('thumbnail_sm_url', 500)->nullable();
            $table->string('thumbnail_md_url', 500)->nullable();
            $table->string('thumbnail_lg_url', 500)->nullable();
            $table->timestamps();

            $table->index('uploaded_by', 'idx_uploaded_by');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_library');
    }
};
