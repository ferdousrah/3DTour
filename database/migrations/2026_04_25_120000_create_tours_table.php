<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by_user_id')->constrained('users');
            $table->string('name', 200);
            $table->text('description')->nullable();
            $table->string('client_name', 150)->nullable();
            $table->date('project_date')->nullable();
            $table->string('thumbnail_url', 500)->nullable();
            $table->string('model_url', 500)->nullable();
            $table->unsignedBigInteger('model_file_size')->nullable();
            $table->json('model_metadata')->nullable();
            $table->json('default_camera')->nullable();

            $table->enum('status', ['draft', 'published', 'archived'])->default('draft');
            $table->enum('visibility', ['private', 'unlisted', 'public'])->default('private');

            $table->string('public_slug', 12)->unique();
            $table->string('custom_slug', 120)->nullable()->unique();

            $table->string('password_hash')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->boolean('allow_embed')->default(true);
            $table->json('embed_allowed_hosts')->nullable();

            $table->string('og_title', 200)->nullable();
            $table->text('og_description')->nullable();
            $table->string('og_image_url', 500)->nullable();

            $table->unsignedBigInteger('view_count')->default(0);
            $table->timestamp('published_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('status', 'idx_status');
            $table->index('expires_at', 'idx_expires');
            $table->index('deleted_at', 'idx_deleted');
        });

        // FULLTEXT index — Laravel's schema builder doesn't have a native helper,
        // so we add it via raw SQL. InnoDB supports FULLTEXT since MySQL 5.6.
        DB::statement('ALTER TABLE tours ADD FULLTEXT ft_search (name, description, client_name)');
    }

    public function down(): void
    {
        Schema::dropIfExists('tours');
    }
};
