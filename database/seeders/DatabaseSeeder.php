<?php

namespace Database\Seeders;

use App\Models\Tour;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Initial admin — credentials are intentionally explicit so the
        // operator knows exactly what to log in with on a fresh install.
        // Change immediately after first login.
        $admin = User::firstOrCreate(
            ['email' => 'admin@local.test'],
            [
                'name' => 'Initial Admin',
                'password' => Hash::make('ChangeMe!2026'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ],
        );

        // A handful of demo tours so the admin lands on a non-empty list.
        if (Tour::count() === 0) {
            foreach ([
                ['name' => 'Gulshan Residence',  'client_name' => 'Mr. Rahman',     'status' => 'draft',     'visibility' => 'private'],
                ['name' => 'Banani Apartment',   'client_name' => 'Ms. Khan',       'status' => 'published', 'visibility' => 'unlisted'],
                ['name' => 'Dhanmondi Showroom', 'client_name' => 'Interior Villa', 'status' => 'draft',     'visibility' => 'private'],
            ] as $row) {
                Tour::create([
                    ...$row,
                    'created_by_user_id' => $admin->id,
                    'description' => 'Demo tour seeded for development.',
                ]);
            }
        }
    }
}
