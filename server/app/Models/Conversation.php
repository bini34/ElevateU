<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\GeneratesUuid;

class Conversation extends Model
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
        'user_id1',
        'user_id2',
        'last_message_id'

    ];

    public function lastMessage(){
        return $this->belongsTo(Message::class, 'last_message_id');
    }
    public function user1(){
        return $this->belongsTo(User::class, 'user_id1');
    }
    public function user2(){
        return $this->belongsTo(User::class, 'user_id2');
    }
}
