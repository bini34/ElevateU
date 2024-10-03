<?php

namespace App\Traits;

use Illuminate\Support\Str;

trait GeneratesUuid
{
    /**
     * Boot function to generate UUID for the model.
     */
    protected static function bootGeneratesUuid()
    {
        static::creating(function ($model) {
            if (empty($model->id)) {
                $model->id = (string) Str::uuid();
            }
        });
    }

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
}
