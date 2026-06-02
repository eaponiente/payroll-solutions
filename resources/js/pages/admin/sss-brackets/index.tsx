import { Form, Head } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDateFormatter } from '@/lib/date';
import { index, update } from '@/routes/sss-brackets';

type SssBracket = {
    id: number;
    salary_min: number;
    salary_max: number | null;
    employee_percentage: number;
    employer_percentage: number;
    effective_from: string;
};

type PageProps = {
    brackets: SssBracket[];
};

type BracketRow = {
    salary_min: string;
    salary_max: string;
    employee_percentage: string;
    employer_percentage: string;
    effective_from: string;
};

function emptyRow(): BracketRow {
    return {
        salary_min: '',
        salary_max: '',
        employee_percentage: '',
        employer_percentage: '',
        effective_from: '',
    };
}

function bracketsToRows(brackets: SssBracket[]): BracketRow[] {
    return brackets.map((b) => ({
        salary_min: b.salary_min.toString(),
        salary_max: b.salary_max?.toString() ?? '',
        employee_percentage: b.employee_percentage.toString(),
        employer_percentage: b.employer_percentage.toString(),
        effective_from: b.effective_from,
    }));
}

export default function SssBracketsIndex({ brackets }: PageProps) {
    const { formatDate: fmtDate } = useDateFormatter();
    const [rows, setRows] = useState<BracketRow[]>(bracketsToRows(brackets));
    const [isEditing, setIsEditing] = useState(false);

    const formattedBrackets = useMemo(
        () =>
            brackets.map((b) => ({
                ...b,
                salaryMinFmt: `₱${b.salary_min.toLocaleString()}`,
                salaryMaxFmt: b.salary_max
                    ? `₱${b.salary_max.toLocaleString()}`
                    : '∞',
                effectiveFromFmt: fmtDate(b.effective_from),
            })),
        [brackets, fmtDate],
    );

    const updateRow = (
        index: number,
        field: keyof BracketRow,
        value: string,
    ) => {
        setRows((prev) =>
            prev.map((row, i) =>
                i === index ? { ...row, [field]: value } : row,
            ),
        );
    };

    const addRow = () => {
        setRows((prev) => [...prev, emptyRow()]);
    };

    const removeRow = (index: number) => {
        setRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleCancel = () => {
        setRows(bracketsToRows(brackets));
        setIsEditing(false);
    };

    return (
        <>
            <Head title="SSS Contribution Brackets" />

            <div className="mb-6 flex items-center justify-between">
                <Heading
                    title="SSS Contribution Brackets"
                    description="Manage salary ranges and contribution percentages"
                />

                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)}>
                        Edit Brackets
                    </Button>
                ) : null}
            </div>

            <p className="mb-4 text-sm text-muted-foreground">
                Saving replaces all brackets. Make sure to include all salary
                ranges.
            </p>

            <Card>
                <CardHeader>
                    <CardTitle>Brackets</CardTitle>
                </CardHeader>
                <CardContent>
                    {!isEditing ? (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-left">
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Salary Min
                                    </th>
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Salary Max
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        Employee %
                                    </th>
                                    <th className="pb-3 text-right font-medium text-muted-foreground">
                                        Employer %
                                    </th>
                                    <th className="pb-3 font-medium text-muted-foreground">
                                        Effective From
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {formattedBrackets.map((bracket) => (
                                    <tr
                                        key={bracket.id}
                                        className="border-b last:border-0"
                                    >
                                        <td className="py-3">
                                            {bracket.salaryMinFmt}
                                        </td>
                                        <td className="py-3">
                                            {bracket.salaryMaxFmt}
                                        </td>
                                        <td className="py-3 text-right">
                                            {bracket.employee_percentage}%
                                        </td>
                                        <td className="py-3 text-right">
                                            {bracket.employer_percentage}%
                                        </td>
                                        <td className="py-3">
                                            {bracket.effectiveFromFmt}
                                        </td>
                                    </tr>
                                ))}
                                {brackets.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="py-8 text-center text-muted-foreground"
                                        >
                                            No brackets configured.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    ) : (
                        <Form
                            {...update.form()}
                            onSuccess={() => setIsEditing(false)}
                            className="space-y-6"
                        >
                            {({
                                processing,
                                errors,
                            }: {
                                processing: boolean;
                                errors: Record<string, string>;
                            }) => (
                                <>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-left">
                                                    <th className="pb-3 font-medium text-muted-foreground">
                                                        Salary Min
                                                    </th>
                                                    <th className="pb-3 font-medium text-muted-foreground">
                                                        Salary Max
                                                    </th>
                                                    <th className="pb-3 font-medium text-muted-foreground">
                                                        Employee %
                                                    </th>
                                                    <th className="pb-3 font-medium text-muted-foreground">
                                                        Employer %
                                                    </th>
                                                    <th className="pb-3 font-medium text-muted-foreground">
                                                        Effective From
                                                    </th>
                                                    <th className="pb-3"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {rows.map((row, i) => (
                                                    <tr
                                                        key={i}
                                                        className="border-b last:border-0"
                                                    >
                                                        <td className="py-2 pr-2">
                                                            <Input
                                                                type="number"
                                                                name={`brackets.${i}.salary_min`}
                                                                value={
                                                                    row.salary_min
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        i,
                                                                        'salary_min',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                min="0"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="py-2 pr-2">
                                                            <Input
                                                                type="number"
                                                                name={`brackets.${i}.salary_max`}
                                                                value={
                                                                    row.salary_max
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        i,
                                                                        'salary_max',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                min="0"
                                                                step="0.01"
                                                                placeholder="∞"
                                                            />
                                                        </td>
                                                        <td className="py-2 pr-2">
                                                            <Input
                                                                type="number"
                                                                name={`brackets.${i}.employee_percentage`}
                                                                value={
                                                                    row.employee_percentage
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        i,
                                                                        'employee_percentage',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                min="0"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="py-2 pr-2">
                                                            <Input
                                                                type="number"
                                                                name={`brackets.${i}.employer_percentage`}
                                                                value={
                                                                    row.employer_percentage
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        i,
                                                                        'employer_percentage',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                min="0"
                                                                step="0.01"
                                                                required
                                                            />
                                                        </td>
                                                        <td className="py-2 pr-2">
                                                            <Input
                                                                type="date"
                                                                name={`brackets.${i}.effective_from`}
                                                                value={
                                                                    row.effective_from
                                                                }
                                                                onChange={(e) =>
                                                                    updateRow(
                                                                        i,
                                                                        'effective_from',
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                required
                                                            />
                                                        </td>
                                                        <td className="py-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removeRow(i)
                                                                }
                                                                disabled={
                                                                    rows.length <=
                                                                    1
                                                                }
                                                            >
                                                                Remove
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <InputError message={errors.brackets} />

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addRow}
                                    >
                                        + Add Row
                                    </Button>

                                    <div className="flex items-center gap-4 pt-4">
                                        <Button disabled={processing}>
                                            Save Brackets
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleCancel}
                                            disabled={processing}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    )}
                </CardContent>
            </Card>
        </>
    );
}

SssBracketsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Admin',
            href: '/admin',
        },
        {
            title: 'SSS Brackets',
            href: index(),
        },
    ],
};
