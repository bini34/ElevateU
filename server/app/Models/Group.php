<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\GeneratesUuid;

class Group extends Model
{
    use HasFactory, GeneratesUuid;

    protected $fillable =[
        'name',
        'description',
        'owner_id',
        'last_message_id'

    ];

    public function users(){
        return $this->belongsToMany(User::class, 'group_users');
    }
    public function messages(){
        return $this->hasMany(Message::class);
    } 

    public function owner(){
        return $this->belongsTo(User::class);
    }
}
