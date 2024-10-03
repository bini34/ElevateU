<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Profile extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'first_name',
        'last_name',
        'bio',
        'profile_picture_URL',
        'location',
        'birthdate',
    ];

    /**
     * Get the user that owns the profile.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the full name of the user by concatenating first name and last name.
     *
     * @return string
     */
    public function getFullNameAttribute()
    {
        return "{$this->first_name} {$this->last_name}";
    }

    /**
     * Set the profile picture URL to a default value if not provided.
     *
     * @param  string  $value
     * @return void
     */
    public function setProfilePictureUrlAttribute($value)
    {
        $this->attributes['profile_picture_URL'] = $value ?: 'default-profile-picture.png';
    }

    /**
     * Scope a query to only include profiles from a specific location.
     *
     * @param  \Illuminate\Database\Eloquent\Builder  $query
     * @param  string  $location
     * @return \Illuminate\Database\Eloquent\Builder
     */
    public function scopeLocatedAt($query, $location)
    {
        return $query->where('location', $location);
    }
}
