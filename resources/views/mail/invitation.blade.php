<x-mail::message>
# You're invited to {{ $appName }}

{{ $invitation->inviter?->name ?? 'An admin' }} has invited you to join **{{ $appName }}** as a **{{ ucfirst($invitation->role) }}**.

Click the button below to set your password and finish creating your account. This link is single-use and expires {{ $invitation->expires_at->diffForHumans() }}.

<x-mail::button :url="$acceptUrl">
Accept invitation
</x-mail::button>

If you weren't expecting this, just ignore the email — no account will be created.

Thanks,
{{ $appName }}
</x-mail::message>
