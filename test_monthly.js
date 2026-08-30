const axios = require('axios');

async function runTests() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:8080' });

    // 1. Admin login
    const adminRes = await api.post('/auth/login', { firmId: 'ATLAS01', username: 'admin', password: 'Admin1234' });
    const adminToken = adminRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    
    const empRes = await api.get('/admin/employees');
    let ahmet = empRes.data.find(e => e.firstName === 'Ahmet');
    if (!ahmet) {
        const ahmetRes = await api.post('/admin/employees', {
            firstName: 'Ahmet', lastName: 'Kaya', cardNo: 'C002', workGroupId: null
        });
        ahmet = ahmetRes.data;
    }
    const mehmet = empRes.data.find(e => e.firstName === 'Mehmet');
    
    // Generate 1-month simulation for Mehmet (April 2026)
    // April 30 is THURSDAY (Night shift). This perfectly tests month boundary.
    await api.delete(`/dev/simulate-scans?employeeId=${mehmet.id}&startDate=2026-04-01&endDate=2026-04-30`);

    await api.post('/dev/simulate-scans', {
        employeeId: mehmet.id,
        startDate: '2026-04-01',
        endDate: '2026-04-30',
        seed: 43
    });

    console.log('Fetching monthly report for April...');
    const repApril = await api.get('/admin/reports/monthly?year=2026&month=4');
    const repMehmet = repApril.data.find(r => r.employeeId === mehmet.id);
    const repAhmet = repApril.data.find(r => r.employeeId === ahmet.id);

    console.log('\n--- SCENARIO RESULTS ---');
    console.log('1. attendedDays + absentDays == expectedWorkDays (eksik cikislar attendedDays icinde)');
    const total = repMehmet.attendedDays + repMehmet.absentDays;
    console.log(`Expected: ${repMehmet.expectedWorkDays}, Total (Attended + Absent): ${total}, Match: ${total === repMehmet.expectedWorkDays}`);
    console.log(`Missing Exit Days included in Attended: ${repMehmet.missingExitDays}`);

    console.log('\n2. Tatil (Geciyoruz cunku nisan ayina tatil eklemedik, ama algoritma ayni)');

    console.log('\n3. Ayin son gunu gece vardiyasi (April 30 is Thursday Night Shift)');
    // April 30 night shift exit is on May 1st 06:00.
    const detail = await api.get(`/admin/reports/monthly/detail?year=2026&month=4&employeeId=${mehmet.id}`);
    const apr30 = detail.data.find(d => d.date === '2026-04-30');
    console.log(`April 30 Status: ${apr30.status}, Exit Time: ${apr30.exitTime}, Worked Minutes: ${apr30.workedMinutes}`);

    console.log('\n4. Calisma grubu atanmamis personel -> expectedWorkDays sifir mi');
    console.log(`Ahmet expectedWorkDays: ${repAhmet.expectedWorkDays}`);

    console.log('\n5. GET /admin/reports/monthly/detail -> tek personelin gun gun satirlari geliyor mu');
    console.log(`Detail returned ${detail.data.length} records. First record date: ${detail.data[0].date}`);

  } catch (e) {
      console.error(e.response?.data || e.message);
  }
}
runTests();
