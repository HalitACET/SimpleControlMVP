const axios = require('axios');

async function runTests() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:8080' });

    // 1. Admin login
    const adminRes = await api.post('/auth/login', { firmId: 'ATLAS01', username: 'admin', password: 'Admin1234' });
    const adminToken = adminRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    
    // 2. Get Employee
    const empRes = await api.get('/admin/employees');
    const mehmetId = empRes.data.find(e => e.firstName === 'Mehmet').id;
    
    // Clear any previous simulations
    await api.delete(`/dev/simulate-scans?employeeId=${mehmetId}&startDate=2026-08-01&endDate=2026-08-31`);
    
    // 3. Ensure a Daytime Shift exists (08:00 - 18:00, break 60)
    let dayShiftId;
    const shifts = await api.get('/admin/shifts');
    let dayShift = shifts.data.find(s => s.name === 'Gunduz');
    if (!dayShift) {
        const sr = await api.post('/admin/shifts', {
            name: 'Gunduz', startTime: '08:00', endTime: '18:00', breakMinutes: 60, lateToleranceMinutes: 10, earlyExitToleranceMinutes: 0
        });
        dayShiftId = sr.data.id;
    } else { dayShiftId = dayShift.id; }

    // Ensure Night Shift exists (22:00 - 06:00)
    let nightShiftId;
    let nightShift = shifts.data.find(s => s.name === 'Gece');
    if (!nightShift) {
        const sr = await api.post('/admin/shifts', {
            name: 'Gece', startTime: '22:00', endTime: '06:00', breakMinutes: 60, lateToleranceMinutes: 10, earlyExitToleranceMinutes: 0
        });
        nightShiftId = sr.data.id;
    } else { nightShiftId = nightShift.id; }

    // 4. Create Work Group combining Day and Night
    const wgs = await api.get('/admin/work-groups');
    let wg = wgs.data.find(w => w.name === 'Karisik Grup');
    let wgId;
    if (!wg) {
        const wgRes = await api.post('/admin/work-groups', {
            name: 'Karisik Grup', dailyWorkMinutes: 540,
            days: [
                { dayOfWeek: 1, shiftId: dayShiftId }, // Mon - Day
                { dayOfWeek: 2, shiftId: dayShiftId }, // Tue - Day
                { dayOfWeek: 3, shiftId: dayShiftId }, // Wed - Day
                { dayOfWeek: 4, shiftId: nightShiftId }, // Thu - Night
                { dayOfWeek: 5, shiftId: dayShiftId }, // Fri - Day
                { dayOfWeek: 6, shiftId: null }, // Sat - OFF
                { dayOfWeek: 7, shiftId: null }, // Sun - OFF
            ]
        });
        wgId = wgRes.data.id;
    } else {
        wgId = wg.id;
    }

    // Assign to Mehmet
    const employee = empRes.data.find(e => e.firstName === 'Mehmet');
    await api.put(`/admin/employees/${mehmetId}`, {
        firstName: employee.firstName, lastName: employee.lastName, cardNo: employee.cardNo, workGroupId: wgId
    });

    // 5. Add a Holiday on Wed 12th
    try { await api.post('/admin/holidays', { name: 'Tatil', holidayDate: '2026-08-12' }); } catch(e) {}

    console.log('Setup complete. Faking manual scans to strictly control scenarios.');

    // We will bypass simulator and use /admin/scans/manual to precisely craft the scenarios
    // Mon Aug 10: S1 Normal (07:55 - 18:05)
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-10T07:55:00', manualNote: 'test' });
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-10T18:05:00', manualNote: 'test' });

    // Tue Aug 11: S2 30 dk gec (08:30 - 18:00) & S3 5 dk gec (08:05 - 18:00) is hard to do in one day. 
    // Let's do S2 on Aug 11
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-11T08:30:00', manualNote: 'test' });
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-11T18:00:00', manualNote: 'test' });

    // S3: 5 dk gec on Friday Aug 14
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-14T08:05:00', manualNote: 'test' });
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-14T18:00:00', manualNote: 'test' });
    
    // S4: Gece vardiyasi Thu Aug 13 (22:05 - 06:00)
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-13T22:05:00', manualNote: 'test' });
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-14T06:00:00', manualNote: 'test' });

    // S5: Tek okutma on Mon Aug 17 (08:00 only)
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-17T08:00:00', manualNote: 'test' });

    // S6: Hic okutma olmayan is gunu: Tue Aug 18

    // S7: Tatil (Wed Aug 12) - okutma olsa bile TATIL olmali. Let's add scans to it to verify.
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-12T08:00:00', manualNote: 'test' });

    // S8: Fazla okutma (Midday) on Mon Aug 10
    await api.post('/admin/scans/manual', { employeeId: mehmetId, scannedAt: '2026-08-10T12:00:00', manualNote: 'test' });

    // Now check reports
    const rep10 = await api.get(`/admin/reports/daily?date=2026-08-10&employeeId=${mehmetId}`);
    console.log('S1 & S8 (Aug 10):', rep10.data[0].status, 'Late:', rep10.data[0].lateMinutes, 'Count:', rep10.data[0].scanCount);

    const rep11 = await api.get(`/admin/reports/daily?date=2026-08-11&employeeId=${mehmetId}`);
    console.log('S2 (Aug 11, 30dk gec):', rep11.data[0].status, 'Late:', rep11.data[0].lateMinutes);

    const rep14 = await api.get(`/admin/reports/daily?date=2026-08-14&employeeId=${mehmetId}`);
    console.log('S3 (Aug 14, 5dk gec):', rep14.data[0].status, 'Late:', rep14.data[0].lateMinutes);

    const rep13 = await api.get(`/admin/reports/daily?date=2026-08-13&employeeId=${mehmetId}`);
    console.log('S4 (Aug 13, Gece):', rep13.data[0].status, 'Entry:', rep13.data[0].entryTime, 'Exit:', rep13.data[0].exitTime, 'WorkedMin:', rep13.data[0].workedMinutes);

    const rep17 = await api.get(`/admin/reports/daily?date=2026-08-17&employeeId=${mehmetId}`);
    console.log('S5 (Aug 17, Tek okutma):', rep17.data[0].status);

    const rep18 = await api.get(`/admin/reports/daily?date=2026-08-18&employeeId=${mehmetId}`);
    console.log('S6 (Aug 18, Sifir okutma):', rep18.data[0].status);

    const rep12 = await api.get(`/admin/reports/daily?date=2026-08-12&employeeId=${mehmetId}`);
    console.log('S7 (Aug 12, Tatil ama okutmali):', rep12.data[0].status, 'ScanCount:', rep12.data[0].scanCount);

  } catch (e) {
      console.error(e.response?.data || e);
  }
}
runTests();
