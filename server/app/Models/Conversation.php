<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\GeneratesUuid;

class Conversation extends Model
{
    use HasFactory, GeneratesUuid;

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
