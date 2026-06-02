import { Form } from '@inertiajs/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
import { manual } from '@/routes/attendance/sheets';

type Employee = {
    id: number;
    first_name: string;
    last_name: string;
    employee_number: string;
};

export default function ManualTimeLogDialog({
    employees,
    hasPermission,
}: {
    employees: Employee[];
    hasPermission: boolean;
}) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState('');

    const filtered = search
        ? employees
              .filter((e) =>
                  `${e.first_name} ${e.last_name} ${e.employee_number}`
                      .toLowerCase()
                      .includes(search.toLowerCase()),
              )
              .slice(0, 15)
        : [];

    if (!hasPermission) {
        return null;
    }

    const selectedEmp = employees.find((e) => e.id.toString() === selectedId);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm">Manual Time Log</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Manual Time Log</DialogTitle>
                    <DialogDescription>
                        Record punch times for an employee. Leave fields empty
                        if not needed.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...manual.form()}
                    className="space-y-4"
                    onSuccess={() => {
                        setOpen(false);
                        setSelectedId('');
                        setSearch('');
                    }}
                >
                    {({ processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label>Employee</Label>
                                <input
                                    type="hidden"
                                    name="employee_id"
                                    value={selectedId}
                                />
                                <Input
                                    placeholder="Type to search..."
                                    value={
                                        selectedId
                                            ? `${selectedEmp?.first_name} ${selectedEmp?.last_name}`
                                            : search
                                    }
                                    onChange={(e) => {
                                        setSelectedId('');
                                        setSearch(e.target.value);
                                    }}
                                />
                                {filtered.length > 0 && (
                                    <div className="rounded-md border bg-background shadow-sm">
                                        {filtered.map((emp) => (
                                            <button
                                                key={emp.id}
                                                type="button"
                                                className="w-full px-3 py-2 text-left text-sm hover:bg-muted"
                                                onClick={() => {
                                                    setSelectedId(
                                                        String(emp.id),
                                                    );
                                                    setSearch('');
                                                }}
                                            >
                                                {emp.first_name} {emp.last_name}{' '}
                                                <span className="text-xs text-muted-foreground">
                                                    #{emp.employee_number}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label>Punch In</Label>
                                    <Input
                                        name="punch_in"
                                        type="datetime-local"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Punch Out</Label>
                                    <Input
                                        name="punch_out"
                                        type="datetime-local"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Lunch Out</Label>
                                    <Input
                                        name="lunch_out"
                                        type="datetime-local"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label>Lunch In</Label>
                                    <Input
                                        name="lunch_in"
                                        type="datetime-local"
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={processing}>
                                    Save
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}
