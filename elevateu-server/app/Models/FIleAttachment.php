<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class FIleAttachment extends Model
{
    use HasFactory;

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
