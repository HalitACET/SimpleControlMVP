const url = 'http://localhost:8080/auth/login';
const pg = require('pg');

async function run() {
    // 1. Login
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmId: 'ATLAS01', username: 'admin', password: 'Admin1234' })
    });
    const { token } = await res.json();
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    const baseUrl = 'http://localhost:8080/admin';

    async function req(method, path, body) {
        const result = await fetch(baseUrl + path, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined
        });
        const status = result.status;
        const text = await result.text();
        let data = text;
        try { data = JSON.parse(text); } catch(e) {}
        return { status, data };
    }

    console.log("1. Tatil ekle (2027-01-01, 'Yılbaşı')");
    const h1 = await req('POST', '/holidays', {
        holidayDate: "2027-01-01",
        name: "Yılbaşı"
    });
    console.log("Status:", h1.status, h1.data);

    console.log("\n2. Aynı tarihe ikinci tatil -> çakışma hatası");
    const h2 = await req('POST', '/holidays', {
        holidayDate: "2027-01-01",
        name: "Yılbaşı 2"
    });
    console.log("Status:", h2.status, h2.data);

    console.log("\n3. İki tatil daha ekle, listele -> tarih sırasına göre artan");
    await req('POST', '/holidays', { holidayDate: "2027-04-23", name: "23 Nisan" });
    await req('POST', '/holidays', { holidayDate: "2027-10-29", name: "29 Ekim" });
    const hList = await req('GET', '/holidays');
    console.log("Tatil Listesi:");
    hList.data.forEach(h => console.log(` - ${h.holidayDate} : ${h.name}`));

    console.log("\n4. ?year=2027 ile listele -> sadece 2027 tatilleri");
    const hList2027 = await req('GET', '/holidays?year=2027');
    console.log("2027 Tatilleri:");
    hList2027.data.forEach(h => console.log(` - ${h.holidayDate} : ${h.name}`));

    console.log("\n5. Personele çalışma grubu ata -> EmployeeResponse'ta workGroupName dolu geliyor");
    const wgRes = await req('GET', '/work-groups');
    let workGroupId;
    if (wgRes.data.length === 0) {
        // Create a WorkGroup first
        const shiftsRes = await fetch('http://localhost:8080/admin/shifts', { headers });
        const shifts = await shiftsRes.json();
        let shiftGunduz = shifts.find(s => s.name.toLowerCase().includes('gündüz')).id;
        const newWg = await req('POST', '/work-groups', {
            name: "Test Group",
            dailyWorkMinutes: 480,
            days: [
                { dayOfWeek: 1, shiftId: shiftGunduz },
                { dayOfWeek: 2, shiftId: shiftGunduz },
                { dayOfWeek: 3, shiftId: shiftGunduz },
                { dayOfWeek: 4, shiftId: shiftGunduz },
                { dayOfWeek: 5, shiftId: shiftGunduz },
                { dayOfWeek: 6, shiftId: null },
                { dayOfWeek: 7, shiftId: null }
            ]
        });
        workGroupId = newWg.data.id;
    } else {
        workGroupId = wgRes.data[0].id;
    }
    
    // Rastgele bir personel oluştur ve grup ata
    const empRes = await req('POST', '/employees', {
        firstName: "Ali",
        lastName: "Veli",
        cardNo: "KART-" + Math.floor(Math.random() * 10000),
        workGroupId: workGroupId
    });
    console.log("Status:", empRes.status);
    console.log("Personel:", empRes.data.firstName, empRes.data.lastName, "| Grup:", empRes.data.workGroupName);

    console.log("\n6. Başka firmanın grubunu atamaya çalış -> hata");
    // "OTHER_FIRM" için veritabanına doğrudan bir çalışma grubu ekle:
    const { Client } = pg;
    const client = new Client({
        user: 'postgres',
        host: 'localhost',
        database: 'simplecontrol',
        password: '12345',
        port: 5432,
    });
    await client.connect();
    const wgName = 'Test-' + Math.floor(Math.random() * 100000);
    const insertRes = await client.query(
        "INSERT INTO work_groups (firm_id, name, daily_work_minutes, active, created_at) VALUES ('OTHER_FIRM', $1, 480, true, now()) RETURNING id",
        [wgName]
    );
    const otherFirmGroupId = insertRes.rows[0].id;
    await client.end();
    
    const errEmp = await req('PUT', `/employees/${empRes.data.id}`, {
        firstName: "Ali",
        lastName: "Veli",
        cardNo: empRes.data.cardNo,
        workGroupId: otherFirmGroupId
    });
    console.log("Status:", errEmp.status, errEmp.data);
    
    // Temizlik: eklediğimiz verileri silelim (veya kalsın)
}

run().catch(console.error);
