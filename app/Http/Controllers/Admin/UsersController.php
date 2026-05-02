<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class UsersController extends Controller
{
    public function index(): Response
    {
        $users = User::withCount('tours')
            ->orderBy('name')
            ->get()
            ->map(fn ($u) => [
                'id'                => $u->id,
                'name'              => $u->name,
                'email'             => $u->email,
                'role'              => $u->role,
                'tours_count'       => $u->tours_count,
                'email_verified_at' => $u->email_verified_at,
                'created_at'        => $u->created_at,
            ]);

        $invitations = Invitation::with('inviter:id,name')
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->get()
            ->map(fn ($i) => [
                'id'         => $i->id,
                'email'      => $i->email,
                'role'       => $i->role,
                'expires_at' => $i->expires_at,
                'inviter'    => $i->inviter ? ['name' => $i->inviter->name] : null,
            ]);

        return Inertia::render('Admin/Users/Index', [
            'users'       => $users,
            'invitations' => $invitations,
        ]);
    }

    public function updateRole(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'role' => ['required', Rule::in(['admin', 'editor', 'viewer'])],
        ]);

        // Safety: prevent demoting yourself if you're the last admin.
        if (
            $request->user()->id === $user->id
            && $user->role === 'admin'
            && $data['role'] !== 'admin'
            && User::where('role', 'admin')->count() <= 1
        ) {
            return back()->withErrors([
                'role' => 'You are the last admin — promote someone else first.',
            ]);
        }

        $user->update($data);

        return back()->with('status', 'Role updated.');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        // Safety: don't allow self-deletion.
        if ($request->user()->id === $user->id) {
            return back()->withErrors([
                'user' => "You can't delete your own account from here. Use Profile → Delete account.",
            ]);
        }

        // Safety: don't strip the last admin.
        if (
            $user->role === 'admin'
            && User::where('role', 'admin')->count() <= 1
        ) {
            return back()->withErrors([
                'user' => 'Cannot delete the last admin.',
            ]);
        }

        $user->delete(); // soft-delete

        return back()->with('status', 'User removed.');
    }
}
