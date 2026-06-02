import { Filter } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export type FilterFieldDef = {
    key: string;
    label: string;
    type: 'text' | 'select';
    options?: { value: string; label: string }[];
};

type Props = {
    fields: FilterFieldDef[];
    onApply: (filters: Record<string, string>, search: string) => void;
    onClear: () => void;
    searchPlaceholder?: string;
    showSearch?: boolean;
};

export function FilterDropdown({
    fields,
    onApply,
    onClear,
    searchPlaceholder = 'Search...',
    showSearch = false,
}: Props) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [enabled, setEnabled] = useState<Record<string, boolean>>({});

    const toggleFilter = (key: string) => {
        setEnabled((prev) => {
            const next = { ...prev, [key]: !prev[key] };

            if (!next[key]) {
                setFilters((f) => {
                    const copy = { ...f };
                    delete copy[key];

                    return copy;
                });
            }

            return next;
        });
    };

    const updateFilter = (key: string, value: string) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    };

    const apply = () => {
        onApply(filters, search);
        setOpen(false);
    };

    const clear = () => {
        setSearch('');
        setFilters({});
        setEnabled({});
        onClear();
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 p-4">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">Filters</h4>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clear}
                            className="h-auto px-2 py-1 text-xs"
                        >
                            Clear
                        </Button>
                    </div>

                    {showSearch && (
                        <Input
                            placeholder={searchPlaceholder}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-8 text-sm"
                        />
                    )}

                    {fields.map((field) => (
                        <div key={field.key} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    id={`filter-${field.key}`}
                                    checked={!!enabled[field.key]}
                                    onCheckedChange={() =>
                                        toggleFilter(field.key)
                                    }
                                />
                                <Label
                                    htmlFor={`filter-${field.key}`}
                                    className="cursor-pointer text-sm"
                                >
                                    {field.label}
                                </Label>
                            </div>
                            {enabled[field.key] && (
                                <div className="pl-6">
                                    {field.type === 'text' ? (
                                        <Input
                                            placeholder={`Filter by ${field.label.toLowerCase()}...`}
                                            value={filters[field.key] ?? ''}
                                            onChange={(e) =>
                                                updateFilter(
                                                    field.key,
                                                    e.target.value,
                                                )
                                            }
                                            className="h-8 text-sm"
                                        />
                                    ) : (
                                        <select
                                            value={filters[field.key] ?? ''}
                                            onChange={(e) =>
                                                updateFilter(
                                                    field.key,
                                                    e.target.value,
                                                )
                                            }
                                            className="h-8 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="">Select...</option>
                                            {field.options?.map((opt) => (
                                                <option
                                                    key={opt.value}
                                                    value={opt.value}
                                                >
                                                    {opt.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    <Button onClick={apply} size="sm" className="w-full">
                        Apply
                    </Button>
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
