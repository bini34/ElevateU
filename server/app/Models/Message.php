<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\GeneratesUuid;

class Message extends Model
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
        'message',
        'sender_id',
        'group_id',
        'receiver_id',
        'conversation_id',
        'client_uuid',
        'read_at'
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    /**
     * Store timestamps with microseconds so same-second messages keep a
     * stable chronological order (columns are timestamp(6)).
     *
     * @var string
     */
    protected $dateFormat = 'Y-m-d H:i:s.u';

    public function sender(){
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function receiver(){
        return $this->belongsTo(User::class, 'receiver_id');
    }

    public function group(){
        return $this->belongsTo(Group::class, 'group_id');
    }
    public function conversation(){
        return $this->belongsTo(Conversation::class, 'conversation_id');
    }

    public function fileAttachments()
    {
        return $this->hasMany(FileAttachment::class, 'message_id');
    }
}
