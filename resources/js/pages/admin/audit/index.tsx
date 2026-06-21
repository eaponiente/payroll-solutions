import { Head, Link, router } from '@inertiajs/react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

type AuditLogEntry = {
    id: number;
    action: string;
    model_type: string;
    model_id: number;
    description: string | null;
    changes: Record<string, { before: unknown; after: unknown }> | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    created_at_formatted: string;
    employee_name: string | null;
    employee: { id: number; first_name: string; last_name: string } | null;
};

type Props = {
    logs: {
        data: AuditLogEntry[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        from: number | null;
        to: number | null;
        total: number;
        current_page: number;
        last_page: number;
    };
    filters: {
        model_type?: string;
        action?: string;
        employee_id?: string;
    };
};

export default function AuditLogIndex({ logs, filters }: Props) {
    const actionBadge = (action: string) => {
        switch (action) {
            case 'created':
                return (
                    <Badge className="border-green-200 bg-green-100 text-green-700">
                        Created
                    </Badge>
                );
            case 'updated':
                return (
                    <Badge className="border-blue-200 bg-blue-100 text-blue-700">
                        Updated
                    </Badge>
                );
            case 'deleted':
                return (
                    <Badge className="border-red-200 bg-red-100 text-red-700">
                        Deleted
                    </Badge>
                );
            default:
                return <Badge>{action}</Badge>;
        }
    };

    const modelLabel = (modelType: string) => {
        return modelType.split('\\').pop() ?? modelType;
    };

    const formatValue = (value: unknown): string => {
        if (value === null || value === undefined) {
            return '—';
        }

        if (typeof value === 'boolean') {
            return value ? 'Yes' : 'No';
        }

        return String(value);
    };

    return (
        <>
            <Head title="Audit Logs" />

            <div className="space-y-6">
                <Heading
                    title="Audit Logs"
                    description="Track all changes made in the system"
                />

                <div className="flex flex-wrap gap-4">
                    <div className="w-44">
                        <Label htmlFor="action-filter" className="sr-only">
                            Action
                        </Label>
                        <Select
                            defaultValue={filters.action ?? '__all__'}
                            onValueChange={(v) => {
                                router.get(
                                    window.location.pathname,
                                    {
                                        ...filters,
                                        action: v === '__all__' ? undefined : v,
                                    },
                                    {
                                        preserveState: true,
                                        preserveScroll: true,
                                    },
                                );
                            }}
                        >
                            <SelectTrigger id="action-filter">
                                <SelectValue placeholder="All Actions" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__all__">
                                    All Actions
                                </SelectItem>
                                <SelectItem value="created">Created</SelectItem>
                                <SelectItem value="updated">Updated</SelectItem>
                                <SelectItem value="deleted">Deleted</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="max-w-xs flex-1">
                        <Label htmlFor="model-filter" className="sr-only">
                            Model
                        </Label>
                        <Input
                            id="model-filter"
                            placeholder="Search by model..."
                            defaultValue={filters.model_type ?? ''}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const val = (e.target as HTMLInputElement)
                                        .value;

                                    router.get(
                                        window.location.pathname,
                                        {
                                            ...filters,
                                            model_type: val || undefined,
                                        },
                                        {
                                            preserveState: true,
                                            preserveScroll: true,
                                        },
                                    );
                                }
                            }}
                        />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>
                            All Changes
                            {logs.total > 0 && (
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    ({logs.total} total)
                                </span>
                            )}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="w-36 pb-3 font-medium text-muted-foreground">
                                        Date
                                    </th>
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        User
                                    </th>
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Action
                                    </th>
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Model
                                    </th>
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Changes
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.data.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No audit logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs.data.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-b last:border-0 hover:bg-muted/30"
                                        >
                                            <td className="py-3 pr-4 text-xs whitespace-nowrap text-muted-foreground">
                                                {log.created_at_formatted}
                                            </td>
                                            <td className="py-3 pr-4">
                                                {log.employee_name ?? 'System'}
                                            </td>
                                            <td className="py-3 pr-4">
                                                {actionBadge(log.action)}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span className="text-xs text-muted-foreground">
                                                    {modelLabel(log.model_type)}
                                                </span>
                                                <span className="ml-1 text-xs text-muted-foreground">
                                                    #{log.model_id}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                {log.changes &&
                                                Object.keys(log.changes)
                                                    .length > 0 ? (
                                                    <div className="space-y-1">
                                                        {Object.entries(
                                                            log.changes,
                                                        )
                                                            .filter(
                                                                ([_, change]) =>
                                                                    change !==
                                                                        null &&
                                                                    typeof change ===
                                                                        'object',
                                                            )
                                                            .slice(0, 3)
                                                            .map(
                                                                ([
                                                                    field,
                                                                    change,
                                                                ]) => (
                                                                    <div
                                                                        key={
                                                                            field
                                                                        }
                                                                        className="text-xs"
                                                                    >
                                                                        <span className="font-medium">
                                                                            {
                                                                                field
                                                                            }
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            {' '}
                                                                            &rarr;{' '}
                                                                        </span>
                                                                        <span className="text-xs text-red-600 line-through">
                                                                            {formatValue(
                                                                                change.before,
                                                                            )}
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            {' '}
                                                                            &rarr;{' '}
                                                                        </span>
                                                                        <span className="text-xs text-green-600">
                                                                            {formatValue(
                                                                                change.after,
                                                                            )}
                                                                        </span>
                                                                    </div>
                                                                ),
                                                            )}
                                                        {Object.keys(
                                                            log.changes,
                                                        ).length > 3 && (
                                                            <span className="text-xs text-muted-foreground">
                                                                +
                                                                {Object.keys(
                                                                    log.changes,
                                                                ).length -
                                                                    3}{' '}
                                                                more
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : log.action === 'created' ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        Record created
                                                    </span>
                                                ) : log.action === 'deleted' ? (
                                                    <span className="text-xs text-muted-foreground">
                                                        Record deleted
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">
                                                        —
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>

                        {logs.links.length > 3 && (
                            <div className="mt-6 flex items-center justify-center gap-1">
                                {logs.links.map((link, i) =>
                                    link.url ? (
                                        <Link
                                            key={i}
                                            href={link.url}
                                            preserveScroll
                                            className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-sm ${
                                                link.active
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'text-muted-foreground hover:bg-accent'
                                            }`}
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ) : (
                                        <span
                                            key={i}
                                            className="inline-flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                                            dangerouslySetInnerHTML={{
                                                __html: link.label,
                                            }}
                                        />
                                    ),
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

AuditLogIndex.layout = {
    breadcrumbs: [
        {
            title: 'Audit Logs',
            href: '/admin/audit-logs',
        },
    ],
};
