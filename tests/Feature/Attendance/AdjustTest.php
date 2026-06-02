<?php

use App\Models\Account;
use App\Models\AttendanceSheet;
use App\Models\AuditLog;
use App\Models\Employee;
use App\Models\Permission;
use App\Models\Role;
use App\Models\TimeLog;
use App\Models\User;
use App\Services\AttendanceService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

function actingAsAdjuster(): array
{
    $account = Account::factory()->create(['timezone' => 'Asia/Manila']);
    $role = Role::factory()->for($account)->create();
    $perm = Permission::firstOrCreate(['slug' => 'attendance.adjust'], ['name' => 'Adjust Attendance', 'group' => 'attendance']);
    $role->permissions()->attach($perm->id, ['scope' => 'account']);
    $emp = Employee::factory()->for($account)->create([
        'role_id' => $role->id,
        'current_daily_rate' => 645,
    ]);
    $user = User::factory()->create(['employee_id' => $emp->id]);
    test()->actingAs($user);

    return compact('account', 'role', 'emp', 'user');
}

function createDayAttendance(Employee $employee, string $date, string $inTime, string $outTime, string $lunchOut = '12:00', string $lunchIn = '13:00'): void
{
    $tz = $employee->account->timezone ?? 'UTC';

    TimeLog::create([
        'account_id' => $employee->account_id,
        'employee_id' => $employee->id,
        'type' => 'in',
        'source' => 'self_service',
        'punched_at' => Carbon::parse("{$date} {$inTime}", $tz)->setTimezone('UTC'),
        'created_at' => now(),
    ]);

    TimeLog::create([
        'account_id' => $employee->account_id,
        'employee_id' => $employee->id,
        'type' => 'lunch_out',
        'source' => 'self_service',
        'punched_at' => Carbon::parse("{$date} {$lunchOut}", $tz)->setTimezone('UTC'),
        'created_at' => now(),
    ]);

    TimeLog::create([
        'account_id' => $employee->account_id,
        'employee_id' => $employee->id,
        'type' => 'lunch_in',
        'source' => 'self_service',
        'punched_at' => Carbon::parse("{$date} {$lunchIn}", $tz)->setTimezone('UTC'),
        'created_at' => now(),
    ]);

    TimeLog::create([
        'account_id' => $employee->account_id,
        'employee_id' => $employee->id,
        'type' => 'out',
        'source' => 'self_service',
        'punched_at' => Carbon::parse("{$date} {$outTime}", $tz)->setTimezone('UTC'),
        'created_at' => now(),
    ]);

    app(AttendanceService::class)->processDailyAttendance($employee, $date);
}

test('adjust punch in time changes late arrival to on time', function () {
    $data = actingAsAdjuster();
    $emp = $data['emp'];
    $date = '2026-06-01';

    createDayAttendance($emp, $date, '09:15', '17:00');

    $sheet = AttendanceSheet::where('employee_id', $emp->id)->whereDate('date', $date)->first();

    $response = $this->post(route('attendance.sheets.adjust', $sheet), [
        'punch_in' => '08:00',
        'note' => 'Employee had valid reason - traffic accident on EDSA',
    ]);

    $response->assertRedirect(route('attendance.sheets.index'));
    $response->assertSessionHas('flash.success');

    $log = TimeLog::where('employee_id', $emp->id)
        ->whereDate('punched_at', $date)
        ->where('type', 'in')
        ->first();

    expect($log->source)->toBe('adjusted');
    expect($log->punched_at->format('H:i'))->toBe('00:00');

    $sheet->refresh();
    expect((float) $sheet->late_minutes)->toBe(0.0);

    app(AttendanceService::class)->processDailyPay($sheet);
    $sheet->refresh();
    expect($sheet->gross_pay)->toBeGreaterThan(0);

    $logCount = AuditLog::where('model_type', TimeLog::class)->count();
    expect($logCount)->toBeGreaterThanOrEqual(1);
});

test('adjust punch out time changes undertime to full hours', function () {
    $data = actingAsAdjuster();
    $emp = $data['emp'];
    $date = '2026-06-02';

    TimeLog::create([
        'account_id' => $emp->account_id,
        'employee_id' => $emp->id,
        'type' => 'in',
        'source' => 'self_service',
        'punched_at' => Carbon::parse("{$date} 08:00", $emp->account->timezone ?? 'UTC')->setTimezone('UTC'),
        'created_at' => now(),
    ]);
    TimeLog::create([
        'account_id' => $emp->account_id,
        'employee_id' => $emp->id,
        'type' => 'out',
        'source' => 'self_service',
        'punched_at' => Carbon::parse("{$date} 14:00", $emp->account->timezone ?? 'UTC')->setTimezone('UTC'),
        'created_at' => now(),
    ]);

    app(AttendanceService::class)->processDailyAttendance($emp, $date);
    $sheet = AttendanceSheet::where('employee_id', $emp->id)->whereDate('date', $date)->first();
    $originalUndertime = (float) $sheet->undertime_minutes;
    expect($originalUndertime)->toBeGreaterThan(0);

    $this->post(route('attendance.sheets.adjust', $sheet), [
        'punch_out' => '17:00',
        'note' => 'Forgot to punch out - confirmed by supervisor',
    ]);

    $sheet->refresh();
    expect((float) $sheet->undertime_minutes)->toBe(60.0);

    $outLog = TimeLog::where('employee_id', $emp->id)
        ->whereDate('punched_at', $date)
        ->where('type', 'out')
        ->first();
    expect($outLog->source)->toBe('adjusted');
});

test('adjust both punch in and punch out in one request', function () {
    $data = actingAsAdjuster();
    $emp = $data['emp'];
    $date = '2026-06-03';

    TimeLog::create([
        'account_id' => $emp->account_id,
        'employee_id' => $emp->id,
        'type' => 'in',
        'source' => 'self_service',
        'punched_at' => Carbon::parse("{$date} 09:30", $emp->account->timezone ?? 'UTC')->setTimezone('UTC'),
        'created_at' => now(),
    ]);
    TimeLog::create([
        'account_id' => $emp->account_id,
        'employee_id' => $emp->id,
        'type' => 'out',
        'source' => 'self_service',
        'punched_at' => Carbon::parse("{$date} 14:00", $emp->account->timezone ?? 'UTC')->setTimezone('UTC'),
        'created_at' => now(),
    ]);

    app(AttendanceService::class)->processDailyAttendance($emp, $date);
    $sheet = AttendanceSheet::where('employee_id', $emp->id)->whereDate('date', $date)->first();

    $this->post(route('attendance.sheets.adjust', $sheet), [
        'punch_in' => '08:00',
        'punch_out' => '17:00',
        'note' => 'Corrected - employee worked full shift',
    ]);

    $sheet->refresh();
    expect((float) $sheet->late_minutes)->toBe(0.0);
    expect((float) $sheet->undertime_minutes)->toBe(60.0);
});

test('adjust lunch timings', function () {
    $data = actingAsAdjuster();
    $emp = $data['emp'];
    $date = '2026-06-04';

    createDayAttendance($emp, $date, '08:00', '17:00');

    $sheet = AttendanceSheet::where('employee_id', $emp->id)->whereDate('date', $date)->first();

    $this->post(route('attendance.sheets.adjust', $sheet), [
        'lunch_out' => '12:30',
        'lunch_in' => '13:30',
        'note' => 'Extended lunch break approved',
    ]);

    $lunchOut = TimeLog::where('employee_id', $emp->id)
        ->whereDate('punched_at', $date)
        ->where('type', 'lunch_out')
        ->first();
    expect($lunchOut->source)->toBe('adjusted');

    $lunchIn = TimeLog::where('employee_id', $emp->id)
        ->whereDate('punched_at', $date)
        ->where('type', 'lunch_in')
        ->first();
    expect($lunchIn->source)->toBe('adjusted');
});

test('adjust requires note field', function () {
    $data = actingAsAdjuster();
    $emp = $data['emp'];
    $date = '2026-06-05';

    createDayAttendance($emp, $date, '08:00', '17:00');

    $sheet = AttendanceSheet::where('employee_id', $emp->id)->whereDate('date', $date)->first();

    $response = $this->post(route('attendance.sheets.adjust', $sheet), [
        'punch_in' => '08:00',
    ]);

    $response->assertSessionHasErrors('note');
});

test('adjust creates audit log entry', function () {
    $data = actingAsAdjuster();
    $emp = $data['emp'];
    $date = '2026-06-06';

    createDayAttendance($emp, $date, '09:00', '17:00');

    $sheet = AttendanceSheet::where('employee_id', $emp->id)->whereDate('date', $date)->first();

    $this->post(route('attendance.sheets.adjust', $sheet), [
        'punch_in' => '08:00',
        'note' => 'Late due to hospital emergency',
    ]);

    $audit = AuditLog::where('model_type', TimeLog::class)
        ->where('description', 'like', '%Punch times for%')
        ->latest()
        ->first();

    expect($audit)->not->toBeNull();
    expect($audit->action)->toBe('adjusted');
    expect($audit->description)->toContain('hospital emergency');
    expect($audit->new_values)->toHaveKey('punch_in');
});

test('adjust preserves timezone - Manila time stored as UTC', function () {
    $data = actingAsAdjuster();
    $emp = $data['emp'];
    $date = '2026-06-07';

    createDayAttendance($emp, $date, '09:00', '17:00');

    $sheet = AttendanceSheet::where('employee_id', $emp->id)->whereDate('date', $date)->first();
    expect($sheet->late_minutes)->toBeGreaterThan(0);

    $this->post(route('attendance.sheets.adjust', $sheet), [
        'punch_in' => '08:00',
        'note' => 'Adjust to on-time',
    ]);

    $sheet->refresh();
    expect($sheet->late_minutes)->toBe(0);
});

test('leaving all time fields empty has no effect', function () {
    $data = actingAsAdjuster();
    $emp = $data['emp'];
    $date = '2026-06-08';

    createDayAttendance($emp, $date, '08:00', '17:00');

    $sheet = AttendanceSheet::where('employee_id', $emp->id)->whereDate('date', $date)->first();
    $originalLate = $sheet->late_minutes;

    $this->post(route('attendance.sheets.adjust', $sheet), [
        'note' => 'Checking - no changes needed',
    ]);

    $sheet->refresh();
    expect($sheet->late_minutes)->toBe($originalLate);
});

test('staff without permission cannot adjust attendance', function () {
    $account = Account::factory()->create();
    $role = Role::factory()->for($account)->create();
    $emp = Employee::factory()->for($account)->create(['role_id' => $role->id]);
    $user = User::factory()->create(['employee_id' => $emp->id]);
    $this->actingAs($user);

    $date = '2026-06-09';
    createDayAttendance($emp, $date, '08:00', '17:00');
    $sheet = AttendanceSheet::where('employee_id', $emp->id)->whereDate('date', $date)->first();

    $response = $this->post(route('attendance.sheets.adjust', $sheet), [
        'punch_in' => '07:00',
        'note' => 'Unauthorized adjust attempt',
    ]);

    $response->assertStatus(403);
});
