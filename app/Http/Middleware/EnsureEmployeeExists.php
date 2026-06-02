<?php

namespace App\Http\Middleware;

use App\Context\TenantContext;
use Closure;
use Illuminate\Http\Request;

class EnsureEmployeeExists
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if (! $user->is_enabled) {
            auth()->logout();

            return redirect()->route('login')
                ->with('flash.error', 'Your account has been disabled.');
        }

        if ($user->is_super_admin && session()->has('active_account_id')) {
            TenantContext::set((int) session('active_account_id'));

            return $next($request);
        }

        if (! $user->employee) {
            return redirect()->route('employees.create')
                ->with('flash.warning', 'Please complete your employee profile.');
        }

        TenantContext::set($user->employee->account_id);

        return $next($request);
    }
}
