<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * FR-120: a single application settings row holding branding + defaults.
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            $table->string('company_name', 150)->default('3D Tour Platform');
            $table->string('logo_url', 500)->nullable();
            $table->string('favicon_url', 500)->nullable();
            $table->string('primary_color', 7)->default('#22d3ee');
            $table->string('support_email', 150)->nullable();
            $table->enum('default_visibility', ['private', 'unlisted', 'public'])
                ->default('unlisted');
            $table->timestamps();
        });

        DB::table('settings')->insert([
            'company_name' => '3D Tour Platform',
            'primary_color' => '#22d3ee',
            'default_visibility' => 'unlisted',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
