<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', \App\Models\Tour::class) ?? false;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:200'],
            'description'   => ['nullable', 'string', 'max:5000'],
            'client_name'   => ['nullable', 'string', 'max:150'],
            'project_date'  => ['nullable', 'date'],
            'thumbnail_url' => ['nullable', 'url', 'max:500'],
        ];
    }
}
