<?php

namespace App\Policies;

use App\Models\Tour;
use App\Models\User;

class TourPolicy
{
    /**
     * Admin override: admins can do anything. Returning null falls through
     * to the specific ability methods below.
     */
    public function before(User $user, string $ability): ?bool
    {
        return $user->role === 'admin' ? true : null;
    }

    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['admin', 'editor', 'viewer'], true);
    }

    public function view(User $user, Tour $tour): bool
    {
        return in_array($user->role, ['admin', 'editor', 'viewer'], true);
    }

    public function create(User $user): bool
    {
        return in_array($user->role, ['admin', 'editor'], true);
    }

    public function update(User $user, Tour $tour): bool
    {
        return in_array($user->role, ['admin', 'editor'], true);
    }

    public function delete(User $user, Tour $tour): bool
    {
        // FR-003 capability matrix: only admins delete tours.
        return $user->role === 'admin';
    }

    public function publish(User $user, Tour $tour): bool
    {
        return in_array($user->role, ['admin', 'editor'], true);
    }
}
