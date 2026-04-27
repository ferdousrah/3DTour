<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Waypoint extends Model
{
    use HasFactory;

    protected $fillable = [
        'tour_id',
        'label',
        'position',
        'look_at',
        'display_order',
        'transition_ms',
        'thumbnail_url',
    ];

    protected function casts(): array
    {
        return [
            'position' => 'array',
            'look_at'  => 'array',
        ];
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class);
    }
}
