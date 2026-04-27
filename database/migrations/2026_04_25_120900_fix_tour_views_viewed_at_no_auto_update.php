<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Slice 9 bug fix: MySQL's `explicit_defaults_for_timestamp=OFF` auto-applies
     * `ON UPDATE CURRENT_TIMESTAMP` to the first non-defaulted TIMESTAMP column.
     * That made `viewed_at` jump to "now" every time we PATCH'd the row from
     * /view/end, with MySQL session TZ baking in a 6-hour shift.
     *
     * Fix: pin viewed_at to "no auto-update on row touch".
     */
    public function up(): void
    {
        DB::statement(
            'ALTER TABLE tour_views MODIFY viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP'
        );
    }

    public function down(): void
    {
        DB::statement(
            'ALTER TABLE tour_views MODIFY viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
        );
    }
};
