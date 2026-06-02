import { Link } from '@inertiajs/react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type Sheet = {
    id: number;
    employee_id: number;
    employee: {
        id: number;
        first_name: string;
        last_name: string;
        employee_number: string;
    };
    date: string;
    time_in: string | null;
    time_out: string | null;
    lunch_in: string | null;
    lunch_out: string | null;
    gross_pay: number;
    late_minutes: number;
    overtime_minutes: number;
    undertime_minutes: number;
    status: string;
};

type Links = Array<{ url: string | null; label: string; active: boolean }>;

export default function AttendanceSheetsTable({
    sheets,
    links,
    onAdjust,
    hasAdjustPerm,
    formatDate,
    formatTime,
    formatCurrency,
    statusVariant,
}: {
    sheets: Sheet[];
    links: Links;
    onAdjust: (s: Sheet) => void;
    hasAdjustPerm: boolean;
    formatDate: (d: string | null) => string;
    formatTime: (d: string | null) => string;
    formatCurrency: (v: number | string | null) => string;
    statusVariant: (
        s: string,
    ) => 'default' | 'secondary' | 'destructive' | 'outline';
}) {
    return (
        <>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b">
                            <th className="px-4 py-2 text-left font-medium">
                                Date
                            </th>
                            <th className="px-4 py-2 text-left font-medium">
                                Employee
                            </th>
                            <th className="px-4 py-2 text-left font-medium">
                                Punch In
                            </th>
                            <th className="px-4 py-2 text-left font-medium">
                                Punch Out
                            </th>
                            <th className="hidden px-4 py-2 text-right font-medium sm:table-cell">
                                Gross Pay
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                                Late
                            </th>
                            <th className="px-4 py-2 text-right font-medium">
                                OT
                            </th>
                            <th className="px-4 py-2 text-left font-medium">
                                Status
                            </th>
                            <th className="px-4 py-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {sheets.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={9}
                                    className="px-4 py-8 text-center text-muted-foreground"
                                >
                                    No attendance sheets found.
                                </td>
                            </tr>
                        ) : (
                            sheets.map((sheet) => (
                                <tr key={sheet.id} className="border-b">
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {formatDate(sheet.date)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {sheet.employee.first_name}{' '}
                                        {sheet.employee.last_name}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {formatTime(sheet.time_in)}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        {formatTime(sheet.time_out)}
                                    </td>
                                    <td className="hidden px-4 py-2 text-right whitespace-nowrap sm:table-cell">
                                        {formatCurrency(sheet.gross_pay)}
                                    </td>
                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                        {sheet.late_minutes > 0 ? (
                                            <span className="text-destructive">
                                                {sheet.late_minutes}m
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-2 text-right whitespace-nowrap">
                                        {sheet.overtime_minutes > 0 ? (
                                            <span className="text-green-600 dark:text-green-400">
                                                {sheet.overtime_minutes}m
                                            </span>
                                        ) : (
                                            '-'
                                        )}
                                    </td>
                                    <td className="px-4 py-2 whitespace-nowrap">
                                        <Badge
                                            variant={statusVariant(
                                                sheet.status,
                                            )}
                                            className="capitalize"
                                        >
                                            {sheet.status}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-2">
                                        {hasAdjustPerm && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onAdjust(sheet)}
                                            >
                                                Adjust
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {links.length > 3 && (
                <div className="mt-6 flex justify-center gap-1">
                    {links.map((link, i) =>
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
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ) : (
                            <span
                                key={i}
                                className="inline-flex h-8 w-8 items-center justify-center text-sm text-muted-foreground"
                                dangerouslySetInnerHTML={{ __html: link.label }}
                            />
                        ),
                    )}
                </div>
            )}
        </>
    );
}
