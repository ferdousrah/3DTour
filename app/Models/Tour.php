<?php

namespace App\Models;

use App\Services\SlugGenerator;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\URL;

class Tour extends Model
{
    use HasFactory, SoftDeletes;

    protected static function booted(): void
    {
        static::creating(function (Tour $tour) {
            $tour->public_slug ??= app(SlugGenerator::class)->generateUnique();
        });
    }

    protected $fillable = [
        'created_by_user_id',
        'name',
        'description',
        'client_name',
        'project_date',
        'thumbnail_url',
        'model_url',
        'model_file_size',
        'model_metadata',
        'default_camera',
        'status',
        'visibility',
        'public_slug',
        'custom_slug',
        'password_hash',
        'expires_at',
        'allow_embed',
        'embed_allowed_hosts',
        'og_title',
        'og_description',
        'og_image_url',
    ];

    protected $hidden = ['password_hash'];

    protected function casts(): array
    {
        return [
            'model_metadata'      => 'array',
            'default_camera'      => 'array',
            'embed_allowed_hosts' => 'array',
            'allow_embed'         => 'boolean',
            'expires_at'          => 'datetime',
            'published_at'        => 'datetime',
            'project_date'        => 'date',
        ];
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function waypoints()
    {
        return $this->hasMany(Waypoint::class)->orderBy('display_order');
    }

    public function hotspots()
    {
        return $this->hasMany(Hotspot::class);
    }

    public function visibleHotspots()
    {
        return $this->hasMany(Hotspot::class)->where('is_visible', true);
    }

    public function views()
    {
        return $this->hasMany(TourView::class);
    }

    public function getPublicUrlAttribute(): string
    {
        return URL::to('/t/' . ($this->custom_slug ?: $this->public_slug));
    }
}
