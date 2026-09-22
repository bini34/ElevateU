<?php

namespace App\Support;

use Illuminate\Validation\Rule;

final class GoalFields
{
    public const TYPES = ['boolean', 'count', 'duration', 'milestone'];
    public const STATUSES = ['active', 'completed', 'archived'];
    public const VISIBILITIES = ['private', 'public'];

    public static function rules(bool $partial = false): array
    {
        return [
            'title' => [$partial ? 'sometimes' : 'required', 'required', 'string', 'max:160'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'visibility' => ['sometimes', 'required', Rule::in(self::VISIBILITIES)],
            'measurement_type' => [$partial ? 'prohibited' : 'required', Rule::in(self::TYPES)],
            'target_value' => ['sometimes', 'nullable', 'numeric', 'gt:0', 'max:999999999.999', 'regex:/\A[0-9]{1,9}(?:\.[0-9]{1,3})?\z/'],
            'unit' => ['sometimes', 'nullable', 'string', 'max:32'],
            'target_date' => ['sometimes', 'nullable', 'date_format:Y-m-d', 'after_or_equal:1000-01-01', 'before_or_equal:9999-12-31'],
        ];
    }

    public static function validateMeasurement(array $data): void
    {
        $measured = in_array($data['measurement_type'], ['count', 'duration'], true);
        $rules = [
            'target_value' => $measured ? 'required' : 'prohibited',
            'unit' => $measured ? ['required', 'string', 'max:32'] : 'prohibited',
        ];
        if ($data['measurement_type'] === 'duration') {
            $rules['unit'][] = Rule::in(['minutes']);
        }
        validator($data, $rules)->validate();
    }
}
