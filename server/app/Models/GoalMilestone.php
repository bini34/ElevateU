<?php

namespace App\Models;

use App\Traits\GeneratesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoalMilestone extends Model
{
    use GeneratesUuid, HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['title', 'position'];
    protected $visible = ['id', 'goal_id', 'title', 'position', 'completed_at', 'created_at', 'updated_at'];

    protected function casts(): array
    {
        return ['position' => 'integer', 'completed_at' => 'datetime'];
    }

    public function goal(): BelongsTo
    {
        return $this->belongsTo(Goal::class);
    }
}
