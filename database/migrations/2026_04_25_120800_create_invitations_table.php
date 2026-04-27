<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invitations', function (Blueprint $table) {
            $table->id();
            $table->string('email');
            $table->enum('role', ['admin', 'editor', 'viewer']);
            // SHA-256 hash of the raw token. The raw token is only ever in the email URL.
            $table->char('token_hash', 64)->unique();
            $table->foreignId('invited_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('accepted_at')->nullable();
            // Nullable to dodge MySQL strict-mode "Invalid default value for TIMESTAMP".
            // App always sets this on insert, so functionally not nullable.
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['email', 'accepted_at'], 'idx_email_pending');
            $table->index('expires_at', 'idx_expires');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invitations');
    }
};
