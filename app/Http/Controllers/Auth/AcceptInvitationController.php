<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\InvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AcceptInvitationController extends Controller
{
    public function __construct(private InvitationService $invitations) {}

    public function show(string $token): Response|RedirectResponse
    {
        $invitation = $this->invitations->findByToken($token);

        if (! $invitation || $invitation->accepted_at || $invitation->expires_at->isPast()) {
            return redirect()->route('login')->with('status', 'That invitation link is invalid or expired.');
        }

        return Inertia::render('Auth/AcceptInvitation', [
            'token' => $token,
            'email' => $invitation->email,
            'role'  => $invitation->role,
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $invitation = $this->invitations->findByToken($token);

        if (! $invitation || $invitation->accepted_at || $invitation->expires_at->isPast()) {
            return redirect()->route('login')->with('status', 'That invitation link is invalid or expired.');
        }

        $data = $request->validate([
            'name'     => ['required', 'string', 'max:150'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ]);

        $user = DB::transaction(function () use ($invitation, $data) {
            $user = User::create([
                'name'              => $data['name'],
                'email'             => $invitation->email,
                'password'          => Hash::make($data['password']),
                'role'              => $invitation->role,
                'email_verified_at' => now(), // invitation acceptance proves email control
            ]);

            $invitation->update(['accepted_at' => now()]);

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }
}
