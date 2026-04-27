<?php

namespace App\Console\Commands;

use App\Services\InvitationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class InviteUserCommand extends Command
{
    protected $signature = 'invite:user
                            {email : Email address to invite}
                            {role : admin|editor|viewer}
                            {--print-link : Echo the accept URL instead of relying on email delivery}';

    protected $description = 'Issue an invitation. Usable from the CLI when no admin UI is available yet.';

    public function handle(InvitationService $invitations): int
    {
        $email = (string) $this->argument('email');
        $role  = (string) $this->argument('role');

        $validator = Validator::make(
            ['email' => $email, 'role' => $role],
            [
                'email' => ['required', 'email'],
                'role'  => ['required', 'in:admin,editor,viewer'],
            ],
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }
            return self::FAILURE;
        }

        [$invitation, $rawToken] = $invitations->issue($email, $role);

        $this->info("Invitation issued for {$email} as {$role}.");
        $this->info("Expires at: {$invitation->expires_at->toDateTimeString()}");

        if ($this->option('print-link')) {
            $this->line('Accept URL: ' . $invitations->acceptUrl($rawToken));
        } else {
            $this->line('Email sent (or logged, depending on MAIL_MAILER).');
            $this->line('Tip: pass --print-link to see the URL directly.');
        }

        return self::SUCCESS;
    }
}
