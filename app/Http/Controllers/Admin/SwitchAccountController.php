<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Account;
use Illuminate\Http\RedirectResponse;

class SwitchAccountController extends Controller
{
    public function __invoke(Account $account): RedirectResponse
    {
        $user = auth()->user();

        if (! $user->is_super_admin) {
            abort(403);
        }

        session(['active_account_id' => $account->id]);

        return redirect()->route('dashboard');
    }
}
