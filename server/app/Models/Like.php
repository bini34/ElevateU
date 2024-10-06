<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\GeneratesUuid;
class Like extends Model
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
     /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'post_id',
    ];

    /**
     * Get the user who liked the post.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the post that is liked.
     */
    public function post()
    {
        return $this->belongsTo(Post::class);
    }
}
