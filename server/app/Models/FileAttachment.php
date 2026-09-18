<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Traits\GeneratesUuid;
class FileAttachment extends Model
{
    use HasFactory, GeneratesUuid;

    /**
     * Always expose the resolved public URL alongside the stored path.
     *
     * @var array<int, string>
     */
    protected $appends = ['url'];

        /**
     * Disable auto-incrementing as we are using UUID.
     *
     * @var bool
     */
    public $incrementing = false;

    /**
     * Set the data type of the primary key ID to string.
     *
     * @var string
     */
    protected $keyType = 'string';
    protected $fillable = [
        'message_id',
        'post_id',
        'name',
        'path',
        'mime',
        'size'
    ];

    /**
     * Absolute public URL for the stored file.
     *
     * Handles both the current storage-relative paths and legacy rows that
     * stored "/storage/..." or fully-qualified URLs.
     */
    public function getUrlAttribute(): string
    {
        if ($this->message_id) {
            return url('/api/message-attachments/'.$this->id);
        }

        $path = (string) $this->path;

        if (Str::startsWith($path, ['http://', 'https://'])) {
            return $path;
        }

        if (Str::startsWith($path, '/storage/')) {
            $path = Str::after($path, '/storage/');
        }

        return Storage::disk('public')->url(ltrim($path, '/'));
    }

    public function message()
    {
        return $this->belongsTo(Message::class, 'message_id');
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
