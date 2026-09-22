<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class MilestoneWriteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return ['title' => [$this->isMethod('post') ? 'required' : 'sometimes', 'required', 'string', 'max:160'],
            'position' => ['sometimes', 'required', 'integer', 'min:1', 'max:1000000']];
    }

    public function after(): array
    {
        return [function (Validator $validator): void {
            foreach (array_diff(array_keys($this->all()), ['title', 'position']) as $field) {
                $validator->errors()->add($field, 'This field is not accepted.');
            }
        }];
    }
}
