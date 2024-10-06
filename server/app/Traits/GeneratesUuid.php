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


    


}
