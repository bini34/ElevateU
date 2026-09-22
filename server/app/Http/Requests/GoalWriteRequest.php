<?php

namespace App\Http\Requests;

use App\Support\GoalFields;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class GoalWriteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Service checks ownership on the locked row.
    }

    public function rules(): array
    {
        return GoalFields::rules(! $this->isMethod('post'));
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach (array_diff(array_keys($this->all()), array_keys($this->rules())) as $field) {
                $validator->errors()->add($field, 'This field is not accepted.');
            }
        }];
    }
}
