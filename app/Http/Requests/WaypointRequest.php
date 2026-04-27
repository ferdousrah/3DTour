<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class WaypointRequest extends FormRequest
{
    public function authorize(): bool
    {
        $tour = $this->route('tour') ?? $this->route('waypoint')?->tour;
        return $tour && $this->user()?->can('update', $tour);
    }

    public function rules(): array
    {
        $required = $this->isMethod('POST') ? 'required' : 'sometimes';

        return [
            'label'         => [$required, 'string', 'max:120'],
            'position'      => [$required, 'array:x,y,z'],
            'position.x'    => [$required, 'numeric'],
            'position.y'    => [$required, 'numeric'],
            'position.z'    => [$required, 'numeric'],
            'look_at'       => [$required, 'array:x,y,z'],
            'look_at.x'     => [$required, 'numeric'],
            'look_at.y'     => [$required, 'numeric'],
            'look_at.z'     => [$required, 'numeric'],
            'display_order' => ['sometimes', 'integer', 'min:0'],
            'transition_ms' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'thumbnail_url' => ['sometimes', 'nullable', 'url', 'max:500'],
        ];
    }
}
