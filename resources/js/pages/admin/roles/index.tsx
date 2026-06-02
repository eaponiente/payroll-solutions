import { Form, Head } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { store, update, destroy } from '@/routes/roles';

type Scope = 'account' | 'self';

type PermissionData = {
    id: number;
    name: string;
    slug: string;
    group: string;
};

type RolePermission = {
    id: number;
    name: string;
    slug: string;
    pivot: {
        scope: Scope;
    };
};

type RoleItem = {
    id: number;
    name: string;
    slug: string;
    is_default: boolean;
    permissions: RolePermission[];
};

type PageProps = {
    roles: RoleItem[];
    permissions: PermissionData[];
};

const GROUPS = [
    'employees',
    'payroll',
    'payslips',
    'attendance',
    'overtime',
    'leaves',
    'corrections',
    'cash_advances',
    'fines',
    'admin',
] as const;

function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
}

export default function RolesIndex({ roles, permissions }: PageProps) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleItem | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<RoleItem | null>(null);
    const [selectedPermissions, setSelectedPermissions] = useState<
        Record<number, Scope>
    >({});
    const [formName, setFormName] = useState('');
    const [formSlug, setFormSlug] = useState('');

    const resetForm = useCallback(() => {
        setSelectedPermissions({});
        setFormName('');
        setFormSlug('');
    }, []);

    const openCreate = useCallback(() => {
        setEditingRole(null);
        resetForm();
    }, [resetForm]);

    const openEdit = useCallback((role: RoleItem) => {
        setEditingRole(role);
        setFormName(role.name);
        setFormSlug(role.slug);
        const permMap: Record<number, Scope> = {};

        for (const p of role.permissions) {
            permMap[p.id] = p.pivot.scope;
        }

        setSelectedPermissions(permMap);
    }, []);

    const handleDialogClose = useCallback(
        (open: boolean) => {
            if (!open) {
                setEditingRole(null);
                resetForm();
            }

            setDialogOpen(open);
        },
        [resetForm],
    );

    const handleNameChange = useCallback(
        (value: string) => {
            setFormName(value);

            if (!editingRole) {
                setFormSlug(generateSlug(value));
            }
        },
        [editingRole],
    );

    const togglePermission = useCallback((permId: number) => {
        setSelectedPermissions((prev) => {
            const next = { ...prev };

            if (permId in next) {
                delete next[permId];
            } else {
                next[permId] = 'self';
            }

            return next;
        });
    }, []);

    const setPermissionScope = useCallback((permId: number, scope: Scope) => {
        setSelectedPermissions((prev) => ({ ...prev, [permId]: scope }));
    }, []);

    const permissionsByGroup = useMemo(() => {
        const map: Record<string, PermissionData[]> = {};

        for (const p of permissions) {
            if (!map[p.group]) {
                map[p.group] = [];
            }

            map[p.group].push(p);
        }

        return map;
    }, [permissions]);

    const toggleGroup = useCallback(
        (group: string) => {
            const groupPerms = permissionsByGroup[group];

            if (!groupPerms) {
                return;
            }

            const allSelected = groupPerms.every(
                (p) => p.id in selectedPermissions,
            );

            setSelectedPermissions((prev) => {
                const next = { ...prev };

                for (const p of groupPerms) {
                    if (allSelected) {
                        delete next[p.id];
                    } else {
                        next[p.id] = 'self';
                    }
                }

                return next;
            });
        },
        [permissionsByGroup, selectedPermissions],
    );

    const getGroupCheckedState = useCallback(
        (group: string): boolean | 'indeterminate' => {
            const groupPerms = permissionsByGroup[group];

            if (!groupPerms || groupPerms.length === 0) {
                return false;
            }

            const selectedCount = groupPerms.filter(
                (p) => p.id in selectedPermissions,
            ).length;

            if (selectedCount === 0) {
                return false;
            }

            if (selectedCount === groupPerms.length) {
                return true;
            }

            return 'indeterminate';
        },
        [permissionsByGroup, selectedPermissions],
    );

    const permissionsArray = useMemo(() => {
        return Object.entries(selectedPermissions).map(([id, scope]) => ({
            id: Number(id),
            scope,
        }));
    }, [selectedPermissions]);

    return (
        <>
            <Head title="Roles & Permissions" />

            <div className="flex items-center justify-between">
                <Heading
                    title="Roles & Permissions"
                    description="Manage role-based access control"
                />
                <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
                    <DialogTrigger asChild>
                        <Button
                            onClick={() => {
                                openCreate();
                            }}
                        >
                            Create Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>
                                {editingRole ? 'Edit Role' : 'Create Role'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingRole
                                    ? 'Update role name and permissions.'
                                    : 'Create a new role with specific permissions.'}
                            </DialogDescription>
                        </DialogHeader>

                        <Form
                            {...(editingRole
                                ? update.form({ role: editingRole.id })
                                : store.form())}
                            transform={() => {
                                const data: Record<string, any> = {
                                    name: formName,
                                    permissions: permissionsArray.map((p) => ({
                                        id: p.id,
                                        scope: p.scope,
                                    })),
                                };

                                if (!editingRole) {
                                    data.slug = formSlug;
                                }

                                return data;
                            }}
                            onSuccess={() => {
                                setDialogOpen(false);
                                setEditingRole(null);
                                resetForm();
                            }}
                            className="space-y-4"
                        >
                            {({
                                processing,
                                errors,
                            }: {
                                processing: boolean;
                                errors: Record<string, string>;
                            }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="role-name">Name</Label>
                                        <Input
                                            id="role-name"
                                            name="name"
                                            required
                                            value={formName}
                                            onChange={(e) =>
                                                handleNameChange(e.target.value)
                                            }
                                        />
                                        <InputError message={errors.name} />
                                    </div>

                                    {!editingRole && (
                                        <div className="grid gap-2">
                                            <Label htmlFor="role-slug">
                                                Slug
                                            </Label>
                                            <Input
                                                id="role-slug"
                                                name="slug"
                                                required
                                                value={formSlug}
                                                onChange={(e) =>
                                                    setFormSlug(e.target.value)
                                                }
                                            />
                                            <p className="text-xs text-muted-foreground">
                                                Auto-generated from name. Used
                                                internally.
                                            </p>
                                            <InputError message={errors.slug} />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <Label>Permissions</Label>
                                        {GROUPS.map((group) => {
                                            const groupPerms =
                                                permissionsByGroup[group];

                                            if (!groupPerms) {
                                                return null;
                                            }

                                            return (
                                                <div
                                                    key={group}
                                                    className="rounded-md border p-3"
                                                >
                                                    <div className="mb-2 flex items-center gap-2">
                                                        <Checkbox
                                                            id={`group-${group}`}
                                                            checked={getGroupCheckedState(
                                                                group,
                                                            )}
                                                            onCheckedChange={() =>
                                                                toggleGroup(
                                                                    group,
                                                                )
                                                            }
                                                        />
                                                        <Label
                                                            htmlFor={`group-${group}`}
                                                            className="cursor-pointer text-sm font-medium capitalize"
                                                        >
                                                            {group.replace(
                                                                /_/g,
                                                                ' ',
                                                            )}
                                                        </Label>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {groupPerms.map(
                                                            (perm) => {
                                                                const isSelected =
                                                                    perm.id in
                                                                    selectedPermissions;
                                                                const scope =
                                                                    selectedPermissions[
                                                                        perm.id
                                                                    ] ?? 'self';

                                                                return (
                                                                    <div
                                                                        key={
                                                                            perm.id
                                                                        }
                                                                        className="flex items-center gap-3"
                                                                    >
                                                                        <Checkbox
                                                                            id={`perm-${perm.id}`}
                                                                            checked={
                                                                                isSelected
                                                                            }
                                                                            onCheckedChange={() =>
                                                                                togglePermission(
                                                                                    perm.id,
                                                                                )
                                                                            }
                                                                        />
                                                                        <Label
                                                                            htmlFor={`perm-${perm.id}`}
                                                                            className="flex-1 cursor-pointer text-sm"
                                                                        >
                                                                            {
                                                                                perm.name
                                                                            }
                                                                        </Label>
                                                                        {isSelected && (
                                                                            <Select
                                                                                value={
                                                                                    scope
                                                                                }
                                                                                onValueChange={(
                                                                                    v: Scope,
                                                                                ) =>
                                                                                    setPermissionScope(
                                                                                        perm.id,
                                                                                        v,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <SelectTrigger className="h-8 w-24 text-xs">
                                                                                    <SelectValue />
                                                                                </SelectTrigger>
                                                                                <SelectContent>
                                                                                    <SelectItem value="account">
                                                                                        Account
                                                                                    </SelectItem>
                                                                                    <SelectItem value="self">
                                                                                        Self
                                                                                    </SelectItem>
                                                                                </SelectContent>
                                                                            </Select>
                                                                        )}
                                                                    </div>
                                                                );
                                                            },
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={
                                                processing ||
                                                permissionsArray.length === 0
                                            }
                                        >
                                            {editingRole
                                                ? 'Save Changes'
                                                : 'Create Role'}
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>All Roles</CardTitle>
                </CardHeader>
                <CardContent>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-left">
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Name
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Slug
                                </th>
                                <th className="pb-3 font-medium text-muted-foreground">
                                    Permissions
                                </th>
                                <th className="pb-3 text-right font-medium text-muted-foreground">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {roles.map((role) => (
                                <tr
                                    key={role.id}
                                    className="border-b last:border-0"
                                >
                                    <td className="py-3 font-medium">
                                        {role.name}
                                        {role.is_default && (
                                            <Badge
                                                variant="secondary"
                                                className="ml-2"
                                            >
                                                Default
                                            </Badge>
                                        )}
                                    </td>
                                    <td className="py-3 text-muted-foreground">
                                        {role.slug}
                                    </td>
                                    <td className="py-3">
                                        <Badge variant="outline">
                                            {role.permissions.length} permission
                                            {role.permissions.length !== 1 &&
                                                's'}
                                        </Badge>
                                    </td>
                                    <td className="py-3 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setEditingRole(role);
                                                    openEdit(role);
                                                    setDialogOpen(true);
                                                }}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                disabled={role.is_default}
                                                onClick={() =>
                                                    setDeleteTarget(role)
                                                }
                                            >
                                                Delete
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {roles.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={4}
                                        className="py-8 text-center text-muted-foreground"
                                    >
                                        No roles configured.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </CardContent>
            </Card>

            <Dialog
                open={deleteTarget !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeleteTarget(null);
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Role</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the role &ldquo;
                            {deleteTarget?.name}
                            &rdquo;? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    {deleteTarget && (
                        <Form
                            {...destroy.form({ role: deleteTarget.id })}
                            onSuccess={() => setDeleteTarget(null)}
                        >
                            {({ processing }: { processing: boolean }) => (
                                <>
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setDeleteTarget(null)
                                            }
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            Delete Role
                                        </Button>
                                    </DialogFooter>
                                </>
                            )}
                        </Form>
                    )}
                </DialogContent>
            </Dialog>
        </>
    );
}

RolesIndex.layout = {
    breadcrumbs: [
        {
            title: 'Roles',
            href: '/admin/roles',
        },
    ],
};
