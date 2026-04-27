<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HotspotMedia extends Model
{
    use HasFactory;

    protected $table = 'hotspot_media';

    protected $fillable = [
        'hotspot_id',
        'file_url',
        'mime_type',
        'alt_text',
        'caption',
        'display_order',
    ];

    public function hotspot()
    {
        return $this->belongsTo(Hotspot::class);
    }
}
