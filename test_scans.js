const axios = require('axios');

async function runTests() {
  try {
    const api = axios.create({ baseURL: 'http://localhost:8080' });

    // 1. Admin login
    const adminRes = await api.post('/auth/login', { firmId: 'ATLAS01', username: 'admin', password: 'Admin1234' });
    const adminToken = adminRes.data.token;
    api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
    console.log('1. Admin logged in');

    // 2. Assign employee to mehmet.yilmaz if not exists
    // But wait, the DataSeeder creates mehmet.yilmaz WITHOUT employee.
    // Let's create an employee and update the user.
    // let employeeId;
    // try {
    //   const empRes = await api.get('/admin/employees');
    //   if (empRes.data.length > 0) {
    //     employeeId = empRes.data[0].id;
    //   } else {
    //     const createRes = await api.post('/admin/employees', { firstName: 'Mehmet', lastName: 'Yilmaz', cardNo: '1234567' });
    //     employeeId = createRes.data.id;
    //   }
    //   console.log('2. Employee ID:', employeeId);
      
    //   const usersRes = await api.get('/admin/users');
    //   const mehmet = usersRes.data.find(u => u.username === 'mehmet.yilmaz');
    //   await api.put(`/admin/users/${mehmet.id}`, { employeeId: employeeId, role: 'EMPLOYEE', username: 'mehmet.yilmaz', firmId: 'ATLAS01', active: true });
    //   console.log('3. Employee assigned to user');
    // } catch(e) {
    //   console.log('Employee assignment error:', e.response?.data || e.message);
    // }

    // 4. Employee login
    let empLogin;
    try {
        empLogin = await api.post('/auth/login', { firmId: 'ATLAS01', username: 'mehmet.yilmaz', password: 'Ilk12345', deviceId: 'DEVICE_X' });
    } catch(e) {
        empLogin = await api.post('/auth/login', { firmId: 'ATLAS01', username: 'mehmet.yilmaz', password: 'Password123!', deviceId: 'DEVICE_X' });
    }
    let empToken = empLogin.data.token;
    console.log('4. Employee logged in');

    // 5. Change password if required
    if (empLogin.data.mustChangePassword) {
      const changeRes = await api.post('/auth/change-password', { oldPassword: 'Ilk12345', newPassword: 'Password123!' }, { headers: { Authorization: `Bearer ${empToken}` }});
      console.log('5. Password changed');
      const newLogin = await api.post('/auth/login', { firmId: 'ATLAS01', username: 'mehmet.yilmaz', password: 'Password123!', deviceId: 'DEVICE_X' });
      empToken = newLogin.data.token;
    }

    const empApi = axios.create({ baseURL: 'http://localhost:8080', headers: { Authorization: `Bearer ${empToken}` }});

    // 6. Device binding
    try {
        await empApi.post('/device/register', { deviceId: 'DEVICE_X', deviceName: 'My Phone' });
        console.log('6. Device registered');
    } catch(e) {
        console.log('Device already registered?', e.response?.data || e.message);
    }

    // Test Scenarios
    console.log('\n--- Running Scan Tests ---');

    // Scenario 1: Gecerli okutma
    try {
      const s1 = await empApi.post('/scans', {
        scannedAt: new Date().toISOString(), latitude: 40.1885, longitude: 29.0610, mockLocation: false, method: 'GPS', deviceId: 'DEVICE_X'
      });
      console.log('S1. Gecerli okutma:', s1.status, s1.data);
    } catch(e) { console.error('S1 failed:', e.response?.data || e.message); }

    // Scenario 2: mockLocation true
    try {
      const s2 = await empApi.post('/scans', {
        scannedAt: new Date().toISOString(), latitude: 40.1885, longitude: 29.0610, mockLocation: true, method: 'GPS', deviceId: 'DEVICE_X'
      });
      console.log('S2. Mock Location:', s2.status, s2.data);
    } catch(e) { console.error('S2 failed:', e.response?.data || e.message); }

    // Scenario 3: Lokasyondan uzak QR
    try {
      const s3 = await empApi.post('/scans', {
        scannedAt: new Date().toISOString(), latitude: 41.0, longitude: 29.0, mockLocation: false, method: 'QR', qrContent: 'PDKS:ATLAS01:ANAKAPI', deviceId: 'DEVICE_X'
      });
      console.log('S3. Uzak QR:', s3.status, s3.data);
    } catch(e) { console.error('S3 failed:', e.response?.data || e.message); }

    // Scenario 4: Yanlis deviceId
    try {
      const s4 = await empApi.post('/scans', {
        scannedAt: new Date().toISOString(), latitude: 40.1885, longitude: 29.0610, mockLocation: false, method: 'GPS', deviceId: 'DEVICE_WRONG'
      });
      console.log('S4. Yanlis deviceId:', s4.status, s4.data);
    } catch(e) { console.log('S4. Yanlis deviceId (Beklenen Hata):', e.response?.status, e.response?.data); }

    // Scenario 5: Admin okutma (no employee)
    try {
      const s5 = await api.post('/scans', { // using admin token
        scannedAt: new Date().toISOString(), latitude: 40.1885, longitude: 29.0610, mockLocation: false, method: 'GPS', deviceId: 'ANY'
      });
      console.log('S5. Admin okutma:', s5.status, s5.data);
    } catch(e) { console.log('S5. Admin okutma (Beklenen Hata):', e.response?.status, e.response?.data); }

    // Scenario 6: Idempotency (Ayni clientId)
    try {
      const clientId = 'TEST_CLIENT_ID_1';
      const s6_1 = await empApi.post('/scans', {
        scannedAt: new Date().toISOString(), latitude: 40.1885, longitude: 29.0610, mockLocation: false, method: 'GPS', deviceId: 'DEVICE_X', clientId: clientId
      });
      console.log('S6.1. Ilk gonderim:', s6_1.status, s6_1.data);
      const s6_2 = await empApi.post('/scans', {
        scannedAt: new Date().toISOString(), latitude: 40.1885, longitude: 29.0610, mockLocation: false, method: 'GPS', deviceId: 'DEVICE_X', clientId: clientId
      });
      console.log('S6.2. Ikinci gonderim (Idempotent):', s6_2.status, s6_2.data, '(Ayni ID: ' + (s6_1.data.id === s6_2.data.id) + ')');
    } catch(e) { console.error('S6 failed:', e.response?.data || e.message); }

    // Scenario 7: Next action
    try {
      const s7 = await empApi.get('/scans/next-action');
      console.log('S7. Next action:', s7.status, s7.data);
    } catch(e) { console.error('S7 failed:', e.response?.data || e.message); }

  } catch(e) {
    console.error('Fatal:', e);
  }
}
runTests();
