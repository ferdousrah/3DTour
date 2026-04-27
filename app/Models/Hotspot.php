<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Hotspot extends Model
{
    use HasFactory;

    protected $fillable = [
        'tour_id',
        'title',
        'description',
        'position',
        'normal',
        'type',
        'price_bdt',
        'external_url',
        'icon',
        'color',
        'display_order',
        'is_visible',
    ];

    protected function casts(): array
    {
        return [
            'position'   => 'array',
            'normal'     => 'array',
            'price_bdt'  => 'decimal:2',
            'is_visible' => 'boolean',
        ];
    }

    public function tour()
    {
        return $this->belongsTo(Tour::class);
    }

    public function media()
    {
        return $this->hasMany(HotspotMedia::class)->orderBy('display_order');
    }
}
