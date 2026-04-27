<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class HotspotRequest extends FormRequest
{
    public function authorize(): bool
    {
        $tour = $this->route('tour') ?? $this->route('hotspot')?->tour;
        return $tour && $this->user()?->can('update', $tour);
    }

    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'title'         => [$required, 'string', 'max:200'],
            'description'   => ['sometimes', 'nullable', 'string', 'max:5000'],
            'position'      => [$required, 'array:x,y,z'],
            'position.x'    => [$required, 'numeric'],
            'position.y'    => [$required, 'numeric'],
            'position.z'    => [$required, 'numeric'],
            'normal'        => ['sometimes', 'nullable', 'array:x,y,z'],
            'normal.x'      => ['sometimes', 'nullable', 'numeric'],
            'normal.y'      => ['sometimes', 'nullable', 'numeric'],
            'normal.z'      => ['sometimes', 'nullable', 'numeric'],
            'type'          => ['sometimes', Rule::in(['info', 'product', 'link'])],
            'price_bdt'     => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'external_url'  => ['sometimes', 'nullable', 'url', 'max:500'],
            'icon'          => ['sometimes', 'string', 'max:50'],
            'color'         => ['sometimes', 'string', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'is_visible'    => ['sometimes', 'boolean'],
        ];
    }
}
