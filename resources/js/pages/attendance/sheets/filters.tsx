import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function AttendanceSheetsFilters({
    onFilter,
}: {
    onFilter: (from: string, to: string, search: string) => void;
}) {
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [search, setSearch] = useState('');

    const handleFilter = () => {
        onFilter(dateFrom, dateTo, search);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleFilter();
        }
    };

    const handleClear = () => {
        setDateFrom('');
        setDateTo('');
        setSearch('');
        onFilter('', '', '');
    };

    return (
        <div className="flex flex-wrap items-end gap-3">
            <div className="grid gap-1.5">
                <Label htmlFor="from">From</Label>
                <Input
                    id="from"
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-auto"
                />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="to">To</Label>
                <Input
                    id="to"
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-auto"
                />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="search">Employee</Label>
                <Input
                    id="search"
                    placeholder="Search name..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-auto"
                />
            </div>
            <Button variant="outline" onClick={handleFilter}>
                Filter
            </Button>
            <Button variant="ghost" onClick={handleClear}>
                Clear
            </Button>
        </div>
    );
}
