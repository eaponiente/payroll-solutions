<?php

namespace App\Http\Controllers\Admin;

use App\Context\TenantContext;
use App\Http\Controllers\Controller;
use App\Models\Permission;
use App\Models\Role;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class RoleController extends Controller
{
    public function index(): Response
    {
        Gate::authorize('admin.manage_roles');

        $roles = Role::with('permissions')->get();
        $permissions = Permission::orderBy('group')->orderBy('name')->get();

        return Inertia::render('admin/roles/index', compact('roles', 'permissions'));
    }

    public function store(Request $request): RedirectResponse
    {
        Gate::authorize('admin.manage_roles');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'slug' => 'required|string|max:100|unique:roles,slug,NULL,id,account_id,'.TenantContext::id(),
            'permissions' => 'required|array',
            'permissions.*.id' => 'required|exists:permissions,id',
            'permissions.*.scope' => 'required|string|in:account,self',
        ]);

        $role = Role::create([
            'account_id' => TenantContext::id(),
            'name' => $validated['name'],
            'slug' => $validated['slug'],
        ]);

        foreach ($validated['permissions'] as $perm) {
            $role->permissions()->attach($perm['id'], ['scope' => $perm['scope']]);
        }

        return back()->with('flash.success', 'Role created.');
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        Gate::authorize('admin.manage_roles');

        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'permissions' => 'required|array',
            'permissions.*.id' => 'required|exists:permissions,id',
            'permissions.*.scope' => 'required|string|in:account,self',
        ]);

        $role->update(['name' => $validated['name']]);

        $role->permissions()->detach();
        foreach ($validated['permissions'] as $perm) {
            $role->permissions()->attach($perm['id'], ['scope' => $perm['scope']]);
        }

        return back()->with('flash.success', 'Role updated.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        Gate::authorize('admin.manage_roles');

        if ($role->is_default) {
            return back()->with('flash.error', 'Cannot delete the default owner role.');
        }

        $role->delete();

        return back()->with('flash.success', 'Role deleted.');
    }
}
