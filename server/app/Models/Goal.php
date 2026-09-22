<?php

namespace App\Models;

use App\Traits\GeneratesUuid;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Goal extends Model
{
    use GeneratesUuid, HasFactory;

    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['title', 'description', 'visibility', 'measurement_type', 'target_value', 'unit', 'target_date'];
    protected $attributes = ['status' => 'active', 'visibility' => 'private'];
    protected $visible = ['id', 'user_id', 'title', 'description', 'visibility', 'status', 'measurement_type', 'target_value', 'unit', 'target_date', 'completed_at', 'archived_at', 'created_at', 'updated_at'];

    protected function casts(): array
    {
        return ['target_value' => 'decimal:3', 'target_date' => 'date:Y-m-d', 'completed_at' => 'datetime', 'archived_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function milestones(): HasMany
    {
        return $this->hasMany(GoalMilestone::class)->orderBy('position')->orderBy('id');
    }
}
