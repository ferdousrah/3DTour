<?php

namespace App\Services;

use App\Models\Tour;

class SlugGenerator
{
    /** Lowercase alphanumeric per FR-080. Excludes ambiguous chars 0/o, 1/l, etc. */
    public const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

    public function generateUnique(): string
    {
        $length = (int) (env('TOUR_PUBLIC_SLUG_LENGTH') ?: 8);

        // 8-char alphanumeric ⇒ 36⁸ ≈ 2.8T combinations. Collision retries
        // are essentially free in practice; bound at 10 to avoid pathological loops.
        for ($attempt = 0; $attempt < 10; $attempt++) {
            $slug = $this->generate($length);
            if (! Tour::where('public_slug', $slug)->exists()) {
                return $slug;
            }
        }

        throw new \RuntimeException('Failed to generate a unique slug after 10 attempts.');
    }

    public function generate(int $length = 8): string
    {
        $alphabet = self::ALPHABET;
        $alphabetLen = strlen($alphabet);
        $slug = '';
        for ($i = 0; $i < $length; $i++) {
            $slug .= $alphabet[random_int(0, $alphabetLen - 1)];
        }
        return $slug;
    }
}
