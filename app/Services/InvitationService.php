<?php

namespace App\Services;

use App\Mail\InvitationMail;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;

class InvitationService
{
    public const TOKEN_LENGTH = 48;
    public const EXPIRY_HOURS = 72;

    /**
     * Issue an invitation. Returns [Invitation, rawToken]. The raw token is
     * only in the URL we email — we never persist it.
     *
     * @return array{0: Invitation, 1: string}
     */
    public function issue(string $email, string $role, ?User $inviter = null): array
    {
        $rawToken = Str::random(self::TOKEN_LENGTH);

        $invitation = Invitation::create([
            'email'              => $email,
            'role'               => $role,
            'token_hash'         => Invitation::hashToken($rawToken),
            'invited_by_user_id' => $inviter?->id,
            'expires_at'         => now()->addHours(self::EXPIRY_HOURS),
        ]);

        Mail::to($email)->send(new InvitationMail($invitation, $this->acceptUrl($rawToken)));

        return [$invitation, $rawToken];
    }

    /**
     * Generate a fresh token for an existing invitation (resend flow).
     */
    public function rotateToken(Invitation $invitation): string
    {
        $rawToken = Str::random(self::TOKEN_LENGTH);

        $invitation->update([
            'token_hash' => Invitation::hashToken($rawToken),
            'expires_at' => now()->addHours(self::EXPIRY_HOURS),
        ]);

        Mail::to($invitation->email)->send(new InvitationMail($invitation, $this->acceptUrl($rawToken)));

        return $rawToken;
    }

    public function findByToken(string $rawToken): ?Invitation
    {
        return Invitation::where('token_hash', Invitation::hashToken($rawToken))->first();
    }

    public function acceptUrl(string $rawToken): string
    {
        return URL::route('invitations.accept', ['token' => $rawToken]);
    }
}
