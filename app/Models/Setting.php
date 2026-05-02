<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = [
        'company_name',
        'logo_url',
        'favicon_url',
        'primary_color',
        'support_email',
        'default_visibility',
    ];

    /**
     * Singleton accessor — there is always exactly one row (id=1).
     * Auto-creates with sensible defaults if the row is missing
     * (e.g. on a fresh install before the seeder runs).
     */
    public static function current(): self
    {
        return static::firstOrCreate(
            ['id' => 1],
            [
                'company_name' => '3D Tour Platform',
                'primary_color' => '#22d3ee',
                'default_visibility' => 'unlisted',
            ],
        );
    }
}
