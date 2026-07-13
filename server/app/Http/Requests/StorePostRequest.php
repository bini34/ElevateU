<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePostRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * The author is always the authenticated user, so no user_id is accepted
     * from the request body.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => 'required_without:file|nullable|string|max:5000',
            'file' => 'required_without:content|nullable|array|max:10',
            'file.*' => 'file|mimes:jpeg,png,jpg,gif,webp,mp4,avi,mov|max:20480',
        ];
    }
}
