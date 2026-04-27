<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // SRS §7.2.7 specifies range-partitioning by viewed_at. InnoDB doesn't
        // support FK on partitioned tables, so we keep FK integrity in v1 and
        // defer partitioning to Phase 2 (see Appendix D risk row).
        Schema::create('tour_views', function (Blueprint $table) {
            $table->id();
            $table->foreignId('tour_id')->constrained('tours')->cascadeOnDelete();
            $table->char('session_id', 36);
            $table->char('ip_hash', 64);
            $table->string('user_agent', 500)->nullable();
            $table->string('referrer', 500)->nullable();
            $table->char('country', 2)->nullable();
            $table->enum('device_type', ['desktop', 'mobile', 'tablet', 'bot', 'other'])->default('other');
            $table->timestamp('viewed_at')->useCurrent();
            $table->unsignedInteger('session_duration_seconds')->nullable();
            $table->json('waypoints_visited')->nullable();
            $table->json('hotspots_opened')->nullable();
            $table->boolean('completed')->default(false);

            $table->index(['tour_id', 'viewed_at'], 'idx_tour_time');
            $table->index('session_id', 'idx_session');
        });

        // Defensive: explicitly drop the implicit ON UPDATE CURRENT_TIMESTAMP
        // that MySQL adds when explicit_defaults_for_timestamp=OFF. We update
        // tour_views rows on /view/end and don't want viewed_at to jump.
        DB::statement(
            'ALTER TABLE tour_views MODIFY viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('tour_views');
    }
};
