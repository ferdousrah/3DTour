<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SlugRedirect extends Model
{
    use HasFactory;

    public $timestamps = false;

    protected $fillable = [
        'old_slug',
        'tour_id',
        'expires_at',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'created_at' => 'datetime',
        ];
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class);
    }
}
