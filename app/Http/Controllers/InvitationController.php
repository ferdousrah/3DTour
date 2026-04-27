<?php

namespace App\Http\Controllers;

use App\Models\Invitation;
use App\Models\User;
use App\Services\InvitationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class InvitationController extends Controller
{
    public function __construct(private InvitationService $invitations) {}

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255'],
            'role'  => ['required', Rule::in(['admin', 'editor', 'viewer'])],
        ]);

        // Reject if user with this email already exists.
        if (User::where('email', $data['email'])->exists()) {
            return back()->withErrors(['email' => 'A user with this email already exists.']);
        }

        // Reject if there is already an active (non-accepted, non-expired) invitation.
        $existing = Invitation::where('email', $data['email'])
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now())
            ->first();

        if ($existing) {
            return back()->withErrors(['email' => 'An active invitation already exists for this email. Use resend instead.']);
        }

        $this->invitations->issue($data['email'], $data['role'], $request->user());

        return back()->with('status', 'Invitation sent.');
    }

    public function resend(Invitation $invitation): RedirectResponse
    {
        if ($invitation->accepted_at) {
            return back()->withErrors(['invitation' => 'That invitation was already accepted.']);
        }

        $this->invitations->rotateToken($invitation);

        return back()->with('status', 'Invitation resent with a fresh link.');
    }

    public function destroy(Invitation $invitation): RedirectResponse
    {
        $invitation->delete();

        return back()->with('status', 'Invitation revoked.');
    }
}
