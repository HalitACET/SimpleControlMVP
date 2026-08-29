const url = 'http://localhost:8080/auth/login';

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

    const baseUrl = 'http://localhost:8080/admin/work-groups';

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

    // Gündüz ve Gece vardiyalarının ID'lerini bulmak için /admin/shifts çekelim
    let shiftsRes = await fetch('http://localhost:8080/admin/shifts', { headers });
    let shifts = await shiftsRes.json();
    let shiftGunduz = shifts.find(s => s.name.toLowerCase().includes('gündüz'))?.id;
    
    // Gece vardiyası yoksa oluşturalım
    let shiftGece = shifts.find(s => s.name.toLowerCase().includes('gece'))?.id;
    if (!shiftGece) {
        const createGeceRes = await fetch('http://localhost:8080/admin/shifts', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                name: "Gece Vardiyası",
                startTime: "22:00:00",
                endTime: "06:00:00",
                breakMinutes: 30,
                lateToleranceMinutes: 10,
                earlyExitToleranceMinutes: 10
            })
        });
        const geceData = await createGeceRes.json();
        shiftGece = geceData.id;
    }

    console.log("1. Yedi günü dolu bir çalışma grubu oluştur (Pzt-Cum gündüz vardiyası, Cmt-Paz shiftId null)");
    const wg1 = await req('POST', '', {
        name: "Standart Ekip",
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
    console.log("Status:", wg1.status, JSON.stringify(wg1.data, null, 2));
    let wgId = wg1.data.id;

    console.log("\n2. Altı gün göndererek grup oluştur -> doğrulama hatası");
    const wg2 = await req('POST', '', {
        name: "Hatalı 6 Gün",
        dailyWorkMinutes: 480,
        days: [
            { dayOfWeek: 1, shiftId: shiftGunduz },
            { dayOfWeek: 2, shiftId: shiftGunduz },
            { dayOfWeek: 3, shiftId: shiftGunduz },
            { dayOfWeek: 4, shiftId: shiftGunduz },
            { dayOfWeek: 5, shiftId: shiftGunduz },
            { dayOfWeek: 6, shiftId: null }
        ]
    });
    console.log("Status:", wg2.status, wg2.data);

    console.log("\n3. Aynı günü iki kez göndererek grup oluştur -> doğrulama hatası");
    const wg3 = await req('POST', '', {
        name: "Hatalı Çift Gün",
        dailyWorkMinutes: 480,
        days: [
            { dayOfWeek: 1, shiftId: shiftGunduz },
            { dayOfWeek: 1, shiftId: shiftGunduz }, // Tekrar
            { dayOfWeek: 3, shiftId: shiftGunduz },
            { dayOfWeek: 4, shiftId: shiftGunduz },
            { dayOfWeek: 5, shiftId: shiftGunduz },
            { dayOfWeek: 6, shiftId: null },
            { dayOfWeek: 7, shiftId: null }
        ]
    });
    console.log("Status:", wg3.status, wg3.data);

    console.log("\n4. Var olmayan bir shiftId göndererek grup oluştur -> hata");
    const wg4 = await req('POST', '', {
        name: "Hatalı Shift ID",
        dailyWorkMinutes: 480,
        days: [
            { dayOfWeek: 1, shiftId: 999999 }, // Var olmayan
            { dayOfWeek: 2, shiftId: shiftGunduz },
            { dayOfWeek: 3, shiftId: shiftGunduz },
            { dayOfWeek: 4, shiftId: shiftGunduz },
            { dayOfWeek: 5, shiftId: shiftGunduz },
            { dayOfWeek: 6, shiftId: null },
            { dayOfWeek: 7, shiftId: null }
        ]
    });
    console.log("Status:", wg4.status, wg4.data);

    // Listeden kontrol edelim (hata durumunda grup oluşmamış olmalı)
    const listRes = await req('GET', '');
    console.log("Hatalı Shift ID sonrası listedeki gruplar:", listRes.data.map(g => g.name));

    console.log("\n5. Aynı isimde ikinci grup -> çakışma hatası");
    const wg5 = await req('POST', '', {
        name: "Standart Ekip",
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
    console.log("Status:", wg5.status, wg5.data);

    console.log("\n6. Grubu güncelle: Cumartesi'ye gece vardiyası ata");
    const wg6 = await req('PUT', `/${wgId}`, {
        name: "Standart Ekip Güncel",
        dailyWorkMinutes: 480,
        days: [
            { dayOfWeek: 1, shiftId: shiftGunduz },
            { dayOfWeek: 2, shiftId: shiftGunduz },
            { dayOfWeek: 3, shiftId: shiftGunduz },
            { dayOfWeek: 4, shiftId: shiftGunduz },
            { dayOfWeek: 5, shiftId: shiftGunduz },
            { dayOfWeek: 6, shiftId: shiftGece }, // Güncellendi
            { dayOfWeek: 7, shiftId: null }
        ]
    });
    console.log("Status:", wg6.status, "Cumartesi shiftId:", wg6.data?.days?.find(d => d.dayOfWeek === 6)?.shiftId);

    console.log("\n7. Personeli olmayan grubu sil -> başarılı");
    const wg7 = await req('DELETE', `/${wgId}`);
    console.log("Status:", wg7.status, wg7.data);
}

run();
