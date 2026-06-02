<?php

namespace App\Http\Controllers\Admin;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\CompanyConfiguration;
use App\Models\Holiday;
use App\Models\SssContributionBracket;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class AdminController extends Controller
{
    public function holidays(): Response
    {
        Gate::authorize('admin.manage_holidays');

        $holidays = Holiday::orderBy('date')->get();

        return Inertia::render('admin/holidays/index', compact('holidays'));
    }

    public function storeHoliday(Request $request): RedirectResponse
    {
        Gate::authorize('admin.manage_holidays');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) {
                    $exists = Holiday::whereDate('date', $value)->exists();
                    if ($exists) {
                        $fail('The date has already been taken.');
                    }
                },
            ],
            'type' => 'required|string|in:regular,special',
        ]);

        Holiday::create(['account_id' => TenantContext::id(), ...$validated]);

        return back()->with('flash.success', 'Holiday added.');
    }

    public function updateHoliday(Request $request, Holiday $holiday): RedirectResponse
    {
        Gate::authorize('admin.manage_holidays');

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'date' => [
                'required',
                'date',
                function ($attribute, $value, $fail) use ($holiday) {
                    $exists = Holiday::where('account_id', TenantContext::id())
                        ->whereDate('date', $value)
                        ->where('id', '!=', $holiday->id)
                        ->exists();
                    if ($exists) {
                        $fail('The date has already been taken.');
                    }
                },
            ],
            'type' => 'required|string|in:regular,special',
        ]);

        $holiday->update($validated);

        return back()->with('flash.success', 'Holiday updated.');
    }

    public function destroyHoliday(Holiday $holiday): RedirectResponse
    {
        Gate::authorize('admin.manage_holidays');

        $holiday->delete();

        return back()->with('flash.success', 'Holiday deleted.');
    }

    public function config(): Response
    {
        Gate::authorize('admin.manage_config');

        $configs = CompanyConfiguration::where('account_id', TenantContext::id())
            ->get()->pluck('value', 'key');

        $account = auth()->user()->employee->account;
        $timezone = $account->timezone;
        $scheduleType = $account->schedule_type;

        return Inertia::render('admin/config/index', compact('configs', 'timezone', 'scheduleType'));
    }

    public function updateConfig(Request $request): RedirectResponse
    {
        Gate::authorize('admin.manage_config');

        $validated = $request->validate([
            'philhealth_premium_percent' => 'nullable|numeric|min:0|max:100',
            'pagibig_monthly_share' => 'nullable|numeric|min:0',
            'timezone' => 'nullable|string|timezone',
            'schedule_type' => 'nullable|string|in:fixed,shifting',
        ]);

        foreach ($validated as $key => $value) {
            if ($value !== null) {
                if ($key === 'timezone' || $key === 'schedule_type') {
                    continue;
                }
                CompanyConfiguration::setValue($key, (string) $value, TenantContext::id());
            }
        }

        if (! empty($validated['timezone'])) {
            auth()->user()->employee->account->update(['timezone' => $validated['timezone']]);
        }

        if (array_key_exists('schedule_type', $validated) && $validated['schedule_type'] !== null) {
            auth()->user()->employee->account->update(['schedule_type' => $validated['schedule_type']]);
        }

        return back()->with('flash.success', 'Configuration updated.');
    }

    public function sssBrackets(): Response
    {
        Gate::authorize('admin.manage_sss');

        $brackets = SssContributionBracket::orderBy('salary_min')->get();

        return Inertia::render('admin/sss-brackets/index', compact('brackets'));
    }

    public function updateSssBrackets(Request $request): RedirectResponse
    {
        Gate::authorize('admin.manage_sss');

        $validated = $request->validate([
            'brackets' => 'required|array|min:1',
            'brackets.*.salary_min' => 'required|numeric|min:0',
            'brackets.*.salary_max' => 'nullable|numeric',
            'brackets.*.employee_percentage' => 'required|numeric|min:0',
            'brackets.*.employer_percentage' => 'required|numeric|min:0',
            'brackets.*.effective_from' => 'required|date',
        ]);

        SssContributionBracket::truncate();
        foreach ($validated['brackets'] as $bracket) {
            SssContributionBracket::create($bracket);
        }

        return back()->with('flash.success', 'SSS brackets updated.');
    }
}
