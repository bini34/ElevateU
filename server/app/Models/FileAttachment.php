<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\GeneratesUuid;
class FileAttachment extends Model
{
    use HasFactory, GeneratesUuid;
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

    public function message()
    {
        return $this->belongsTo(Message::class);
    }

    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
