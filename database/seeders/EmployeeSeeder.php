<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Employee;
use App\Models\EmployeeSchedule;
use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    private array $employees = [
        [
            'first_name' => 'Juan',
            'middle_name' => 'Santos',
            'last_name' => 'Dela Cruz',
            'phone' => '0917-123-4567',
            'address' => '123 Rizal St., Barangay San Isidro, Makati City',
            'location' => 'Makati',
            'birth_date' => '1990-03-15',
            'hire_date' => '2025-06-01',
            'position' => 'regular',
            'status' => 'active',
            'current_daily_rate' => 800.00,
            'sss_number' => 'SSS-1234567890',
            'philhealth_number' => 'PH-987654321012',
            'pagibig_number' => 'PAG-112233445566',
            'tin_number' => 'TIN-111-222-333',
            'leaves_used_this_year' => 2,
            'notes' => 'Senior developer, team lead for payroll module.',
        ],
        [
            'first_name' => 'Maria',
            'middle_name' => 'Clara',
            'last_name' => 'Reyes',
            'phone' => '0922-234-5678',
            'address' => '456 Quezon Ave., Barangay Pinyahan, Quezon City',
            'location' => 'Quezon City',
            'birth_date' => '1992-07-22',
            'hire_date' => '2025-08-15',
            'position' => 'regular',
            'status' => 'active',
            'current_daily_rate' => 750.00,
            'sss_number' => 'SSS-2345678901',
            'philhealth_number' => 'PH-876543210123',
            'pagibig_number' => 'PAG-223344556677',
            'tin_number' => 'TIN-222-333-444',
            'leaves_used_this_year' => 1,
            'notes' => 'HR specialist handling employee relations.',
        ],
        [
            'first_name' => 'Jose',
            'middle_name' => 'Paciano',
            'last_name' => 'Gonzales',
            'phone' => '0933-345-6789',
            'address' => '789 Mabini St., Barangay Malate, Manila',
            'location' => 'Manila',
            'birth_date' => '1988-11-05',
            'hire_date' => '2024-12-10',
            'position' => 'contractual',
            'status' => 'active',
            'current_daily_rate' => 650.00,
            'sss_number' => 'SSS-3456789012',
            'philhealth_number' => 'PH-765432101234',
            'pagibig_number' => 'PAG-334455667788',
            'tin_number' => 'TIN-333-444-555',
            'leaves_used_this_year' => 4,
            'notes' => 'Contractual staff for 6-month data migration project.',
        ],
        [
            'first_name' => 'Andrea',
            'middle_name' => 'Lacson',
            'last_name' => 'Santos',
            'phone' => '0944-456-7890',
            'address' => '101 Bonifacio St., Barangay Fort Bonifacio, Taguig City',
            'location' => 'Taguig',
            'birth_date' => '1995-01-30',
            'hire_date' => '2025-09-20',
            'position' => 'regular',
            'status' => 'active',
            'current_daily_rate' => 900.00,
            'sss_number' => 'SSS-4567890123',
            'philhealth_number' => 'PH-654321012345',
            'pagibig_number' => 'PAG-445566778899',
            'tin_number' => 'TIN-444-555-666',
            'leaves_used_this_year' => 0,
            'notes' => 'Accountant handling payroll disbursements and tax filings.',
        ],
        [
            'first_name' => 'Miguel',
            'middle_name' => 'Torres',
            'last_name' => 'Aquino',
            'phone' => '0955-567-8901',
            'address' => '202 Aguinaldo St., Barangay San Antonio, Pasig City',
            'location' => 'Pasig',
            'birth_date' => '1993-09-12',
            'hire_date' => '2025-11-01',
            'position' => 'regular',
            'status' => 'active',
            'current_daily_rate' => 700.00,
            'sss_number' => 'SSS-5678901234',
            'philhealth_number' => 'PH-543210123456',
            'pagibig_number' => 'PAG-556677889900',
            'tin_number' => 'TIN-555-666-777',
            'leaves_used_this_year' => 3,
            'notes' => 'IT support technician maintaining office hardware.',
        ],
        [
            'first_name' => 'Elena',
            'middle_name' => 'Flores',
            'last_name' => 'Bautista',
            'phone' => '0966-678-9012',
            'address' => '303 Luna St., Barangay Poblacion, Cebu City',
            'location' => 'Cebu',
            'birth_date' => '1996-06-18',
            'hire_date' => '2025-07-05',
            'position' => 'regular',
            'status' => 'active',
            'current_daily_rate' => 600.00,
            'sss_number' => 'SSS-6789012345',
            'philhealth_number' => 'PH-432101234567',
            'pagibig_number' => 'PAG-667788990011',
            'tin_number' => 'TIN-666-777-888',
            'leaves_used_this_year' => 0,
            'notes' => 'Junior recruiter sourcing candidates.',
        ],
        [
            'first_name' => 'Carlos',
            'middle_name' => 'Mendoza',
            'last_name' => 'Rivera',
            'phone' => '0977-789-0123',
            'address' => '404 Roxas Blvd., Barangay Tambo, Paranaque City',
            'location' => 'Paranaque',
            'birth_date' => '1985-04-25',
            'hire_date' => '2025-03-17',
            'position' => 'project_based',
            'status' => 'terminated',
            'end_date' => '2026-04-30',
            'current_daily_rate' => 1100.00,
            'sss_number' => 'SSS-7890123456',
            'philhealth_number' => 'PH-321012345678',
            'pagibig_number' => 'PAG-778899001122',
            'tin_number' => 'TIN-777-888-999',
            'leaves_used_this_year' => 5,
            'notes' => 'Project-based consultant, contract ended April 2026.',
        ],
        [
            'first_name' => 'Sofia',
            'middle_name' => 'Garcia',
            'last_name' => 'Lopez',
            'phone' => '0988-890-1234',
            'address' => '505 Kalayaan Ave., Barangay Central, Diliman, Quezon City',
            'location' => 'Quezon City',
            'birth_date' => '1991-12-03',
            'hire_date' => '2024-06-12',
            'position' => 'regular',
            'status' => 'resigned',
            'end_date' => '2026-02-28',
            'current_daily_rate' => 850.00,
            'sss_number' => 'SSS-8901234567',
            'philhealth_number' => 'PH-210123456789',
            'pagibig_number' => 'PAG-889900112233',
            'tin_number' => 'TIN-888-999-000',
            'leaves_used_this_year' => 2,
            'notes' => 'Former operations manager. Resigned February 2026.',
        ],
        [
            'first_name' => 'Ramon',
            'middle_name' => 'Villanueva',
            'last_name' => 'Perez',
            'phone' => '0999-901-2345',
            'address' => '606 Sampaloc St., Barangay 450, Sampaloc, Manila',
            'location' => 'Manila',
            'birth_date' => '1987-08-08',
            'hire_date' => '2025-05-22',
            'position' => 'regular',
            'status' => 'active',
            'current_daily_rate' => 950.00,
            'sss_number' => 'SSS-9012345678',
            'philhealth_number' => 'PH-109876543210',
            'pagibig_number' => 'PAG-990011223344',
            'tin_number' => 'TIN-999-000-111',
            'leaves_used_this_year' => 1,
            'notes' => 'Compliance officer ensuring BIR and DOLE requirements.',
        ],
        [
            'first_name' => 'Luz',
            'middle_name' => 'Diaz',
            'last_name' => 'Fernandez',
            'phone' => '0910-012-3456',
            'address' => '707 Yakal St., Barangay San Lorenzo, Makati City',
            'location' => 'Makati',
            'birth_date' => '1994-10-14',
            'hire_date' => '2025-10-08',
            'position' => 'regular',
            'status' => 'active',
            'current_daily_rate' => 820.00,
            'sss_number' => 'SSS-0123456789',
            'philhealth_number' => 'PH-098765432101',
            'pagibig_number' => 'PAG-001122334455',
            'tin_number' => 'TIN-000-111-222',
            'leaves_used_this_year' => 0,
            'notes' => 'Administrative assistant, handles office inventory and supplies.',
        ],
    ];

    public function run(): void
    {
        $account = Account::firstOrFail();
        $staffRole = Role::where('account_id', $account->id)->where('slug', 'staff')->first();

        foreach ($this->employees as $i => $data) {
            $seq = $i + 30;
            $num = "EMP-2026-0{$seq}";
            $email = strtolower($data['first_name'].'.'.$data['last_name'].$seq).'@demo.com';

            $employee = Employee::firstOrCreate(
                ['employee_number' => $num],
                [
                    'account_id' => $account->id,
                    'role_id' => $staffRole?->id,
                    'username' => $num,
                    'first_name' => $data['first_name'],
                    'middle_name' => $data['middle_name'],
                    'last_name' => $data['last_name'],
                    'phone' => $data['phone'],
                    'address' => $data['address'],
                    'location' => $data['location'],
                    'birth_date' => $data['birth_date'],
                    'hire_date' => $data['hire_date'],
                    'end_date' => $data['end_date'] ?? null,
                    'position' => $data['position'],
                    'status' => $data['status'],
                    'current_daily_rate' => $data['current_daily_rate'],
                    'sss_number' => $data['sss_number'],
                    'philhealth_number' => $data['philhealth_number'],
                    'pagibig_number' => $data['pagibig_number'],
                    'tin_number' => $data['tin_number'],
                    'leaves_used_this_year' => $data['leaves_used_this_year'],
                    'notes' => $data['notes'],
                ],
            );

            $user = User::firstOrCreate(
                ['email' => $email],
                [
                    'name' => "{$data['first_name']} {$data['last_name']}",
                    'password' => Hash::make('password'),
                    'employee_id' => $employee->id,
                ],
            );

            $account->users()->syncWithoutDetaching([$user->id]);

            EmployeeSchedule::firstOrCreate(
                ['employee_id' => $employee->id, 'effective_from' => $data['hire_date']],
                [
                    'account_id' => $account->id,
                    'schedule_start' => '08:00',
                    'schedule_end' => '17:00',
                    'rest_days' => ['sunday'],
                    'effective_from' => $data['hire_date'],
                ],
            );
        }

        $this->command?->info('EmployeeSeeder: 10 employees with all fields populated.');
    }
}
