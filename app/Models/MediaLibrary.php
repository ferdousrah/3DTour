<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaLibrary extends Model
{
    use HasFactory;

    protected $table = 'media_library';

    protected $fillable = [
        'uploaded_by',
        'file_name',
        'file_url',
        'mime_type',
        'file_size',
        'width',
        'height',
        'thumbnail_sm_url',
        'thumbnail_md_url',
        'thumbnail_lg_url',
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
