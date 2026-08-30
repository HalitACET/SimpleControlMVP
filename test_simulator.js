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
    
    // 3. Create Night Shift
    let nightShiftId;
    try {
        const shifts = await api.get('/admin/shifts');
        let nightShift = shifts.data.find(s => s.name === 'Gece');
        if (!nightShift) {
            const shiftRes = await api.post('/admin/shifts', {
                name: 'Gece', startTime: '22:00', endTime: '06:00', breakMinutes: 60, lateToleranceMinutes: 10, earlyExitToleranceMinutes: 0
            });
            nightShiftId = shiftRes.data.id;
        } else {
            nightShiftId = nightShift.id;
        }
    } catch(e) { console.error('Shift error', e); }

    // 4. Create Work Group
    let wgId;
    try {
        const wgs = await api.get('/admin/work-groups');
        let wg = wgs.data.find(w => w.name === 'Gece Grubu');
        if (!wg) {
            const wgRes = await api.post('/admin/work-groups', {
                name: 'Gece Grubu', dailyWorkMinutes: 420,
                days: [
                    { dayOfWeek: 1, shiftId: nightShiftId },
                    { dayOfWeek: 2, shiftId: nightShiftId },
                    { dayOfWeek: 3, shiftId: nightShiftId },
                    { dayOfWeek: 4, shiftId: nightShiftId },
                    { dayOfWeek: 5, shiftId: nightShiftId },
                    { dayOfWeek: 6, shiftId: null }, // Weekend
                    { dayOfWeek: 7, shiftId: null },
                ]
            });
            wgId = wgRes.data.id;
        } else {
            wgId = wg.id;
        }
    } catch(e) { console.error('WorkGroup error', e.response?.data); }

    // 5. Assign Work Group to Employee
    try {
        const employee = empRes.data.find(e => e.firstName === 'Mehmet');
        await api.put(`/admin/employees/${mehmetId}`, {
            firstName: employee.firstName, lastName: employee.lastName, cardNo: employee.cardNo, workGroupId: wgId
        });
        console.log('WorkGroup assigned to Mehmet');
    } catch(e) { console.error('Assign error', e.response?.data); }

    // Delete prev
    await api.delete(`/dev/simulate-scans?employeeId=${mehmetId}&startDate=2026-08-01&endDate=2026-08-31`);
    
    // Add holiday
    try {
        await api.post('/admin/holidays', { name: 'Zafer Bayrami', holidayDate: '2026-08-30' });
    } catch(e) {}

    // 6. Test Simulator Endpoint
    const simReq = {
        employeeId: mehmetId,
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        seed: 12345
    };
    
    const simRes = await api.post('/dev/simulate-scans', simReq);
    console.log('Simulate Scans:', simRes.data);

    // 7. Verify Data
    // We will query the DB manually using PSQL to verify night shift exits and holidays
    
  } catch (e) {
      console.error(e.response?.data || e);
  }
}

runTests();
