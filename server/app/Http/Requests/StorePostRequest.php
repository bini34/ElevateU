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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'content' => 'required_without:file|string',
            'file' => 'required_without:content|nullable|array', // Ensures 'file' is an array
            'file.*' => 'mimes:jpeg,png,jpg,gif,mp4,avi,mov|max:20480', // Validates each file in the array
            'user_id' => 'required|string|exists:users,id',
        ];
    }
}
