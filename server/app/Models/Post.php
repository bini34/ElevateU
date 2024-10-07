<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\GeneratesUuid;
class Post extends Model
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
        'content'
    ];

    /**
     * Define the relationship between a post and its user.
     * Each post belongs to a user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    
    public function likes()
    {
        return $this->hasMany(Like::class);
    }
 
    // Define relationship to comments
    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    // Define relationship to file attachments
    public function attachments()
    {
        return $this->hasMany(FileAttachment::class);
    }
}
