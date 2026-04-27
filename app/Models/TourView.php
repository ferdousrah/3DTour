<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TourView extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'tour_id',
        'session_id',
        'ip_hash',
        'user_agent',
        'referrer',
        'country',
        'device_type',
        'viewed_at',
        'session_duration_seconds',
        'waypoints_visited',
        'hotspots_opened',
        'completed',
    ];

    protected function casts(): array
    {
        return [
            'viewed_at'         => 'datetime',
            'waypoints_visited' => 'array',
            'hotspots_opened'   => 'array',
            'completed'         => 'boolean',
        ];
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class);
    }
}
