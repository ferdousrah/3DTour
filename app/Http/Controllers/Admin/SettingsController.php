<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function edit(): Response
    {
        return Inertia::render('Admin/Settings/Index', [
            'settings' => Setting::current()->only([
                'company_name',
                'logo_url',
                'favicon_url',
                'primary_color',
                'support_email',
                'default_visibility',
            ]),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'company_name'       => ['required', 'string', 'max:150'],
            'primary_color'      => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'support_email'      => ['nullable', 'email', 'max:150'],
            'default_visibility' => ['required', Rule::in(['private', 'unlisted', 'public'])],
            'logo'               => ['nullable', 'file', 'image', 'mimes:png,jpg,jpeg,webp,svg', 'max:2048'],
            'favicon'            => ['nullable', 'file', 'image', 'mimes:png,ico,svg', 'max:512'],
            'remove_logo'        => ['sometimes', 'boolean'],
            'remove_favicon'     => ['sometimes', 'boolean'],
        ]);

        $settings = Setting::current();
        $disk = Storage::disk('public');

        if ($request->boolean('remove_logo')) {
            $this->deleteAsset($settings->logo_url);
            $data['logo_url'] = null;
        } elseif ($request->hasFile('logo')) {
            $this->deleteAsset($settings->logo_url);
            $path = $request->file('logo')->store('branding', 'public');
            $data['logo_url'] = '/storage/' . $path;
        }

        if ($request->boolean('remove_favicon')) {
            $this->deleteAsset($settings->favicon_url);
            $data['favicon_url'] = null;
        } elseif ($request->hasFile('favicon')) {
            $this->deleteAsset($settings->favicon_url);
            $path = $request->file('favicon')->store('branding', 'public');
            $data['favicon_url'] = '/storage/' . $path;
        }

        unset($data['logo'], $data['favicon'], $data['remove_logo'], $data['remove_favicon']);

        $settings->update($data);

        return back()->with('status', 'Branding updated.');
    }

    private function deleteAsset(?string $url): void
    {
        if (! $url || ! str_starts_with($url, '/storage/')) return;
        $path = substr($url, strlen('/storage/'));
        Storage::disk('public')->delete($path);
    }
}
