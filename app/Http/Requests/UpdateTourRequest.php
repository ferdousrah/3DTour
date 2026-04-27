<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTourRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('tour')) ?? false;
    }

    public function rules(): array
    {
        $tourId = $this->route('tour')?->id;

        return [
            'name'           => ['sometimes', 'required', 'string', 'max:200'],
            'description'    => ['sometimes', 'nullable', 'string', 'max:5000'],
            'client_name'    => ['sometimes', 'nullable', 'string', 'max:150'],
            'project_date'   => ['sometimes', 'nullable', 'date'],
            'thumbnail_url'  => ['sometimes', 'nullable', 'url', 'max:500'],
            'custom_slug'    => [
                'sometimes',
                'nullable',
                'string',
                'min:3',
                'max:120',
                'regex:/^[a-z0-9-]+$/',
                'not_in:admin,api,t,login,logout,invite,invitations,dashboard,profile',
                Rule::unique('tours', 'custom_slug')->ignore($tourId),
            ],
            'og_title'       => ['sometimes', 'nullable', 'string', 'max:200'],
            'og_description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'og_image_url'   => ['sometimes', 'nullable', 'url', 'max:500'],

            // FR-090 visibility levels
            'visibility'     => ['sometimes', Rule::in(['private', 'unlisted', 'public'])],

            // FR-091 password — `password` is the raw input; we hash it in the controller.
            // `clear_password` flag removes the password entirely.
            'password'        => ['sometimes', 'nullable', 'string', 'min:4', 'max:255'],
            'clear_password'  => ['sometimes', 'boolean'],

            // FR-092 expiry
            'expires_at'      => ['sometimes', 'nullable', 'date', 'after:now'],

            // FR-093 embed control
            'allow_embed'         => ['sometimes', 'boolean'],
            'embed_allowed_hosts' => ['sometimes', 'nullable', 'array'],
            'embed_allowed_hosts.*' => [
                'string',
                'max:255',
                // Host pattern: optional `*.` then domain chars, dots, hyphens.
                'regex:/^(\*\.)?[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i',
            ],
        ];
    }
}
