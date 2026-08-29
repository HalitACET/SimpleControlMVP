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

    const baseUrl = 'http://localhost:8080/admin/shifts';

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

    console.log("1. Gündüz vardiyası oluştur (08:00–17:00, 60 dk mola)");
    const s1 = await req('POST', '', {
        name: "Gündüz",
        startTime: "08:00:00",
        endTime: "17:00:00",
        breakMinutes: 60,
        lateToleranceMinutes: 10,
        earlyExitToleranceMinutes: 10
    });
    console.log("Status:", s1.status, s1.data);
    let s1Id = null;
    if (s1.status === 201) s1Id = s1.data.id;
    else if (s1.status === 409) {
        // Zaten varsa silelim ve baştan oluşturalım, ama id'sini almamız lazım.
        // Hata geldiği için pas geçebiliriz, Seed'den dolayı Gündüz zaten var!
        console.log("Gündüz zaten var, adı Gündüz Test olarak deniyorum...");
        const s1_alt = await req('POST', '', {
            name: "Gündüz Test",
            startTime: "08:00:00",
            endTime: "17:00:00",
            breakMinutes: 60,
            lateToleranceMinutes: 10,
            earlyExitToleranceMinutes: 10
        });
        console.log("Status:", s1_alt.status, s1_alt.data);
        if (s1_alt.status === 201) s1Id = s1_alt.data.id;
    }

    console.log("\n2. Gece vardiyası oluştur (22:00–06:00, 30 dk mola)");
    const s2 = await req('POST', '', {
        name: "Gece Vardiyası",
        startTime: "22:00:00",
        endTime: "06:00:00",
        breakMinutes: 30,
        lateToleranceMinutes: 10,
        earlyExitToleranceMinutes: 10
    });
    console.log("Status:", s2.status, s2.data);
    let s2Id = s2.data.id;

    console.log("\n3. startTime = endTime gönder -> doğrulama hatası");
    const s3 = await req('POST', '', {
        name: "Hatalı",
        startTime: "08:00:00",
        endTime: "08:00:00",
        breakMinutes: 60,
        lateToleranceMinutes: 10,
        earlyExitToleranceMinutes: 10
    });
    console.log("Status:", s3.status, s3.data);

    console.log("\n4. Aynı isimde ikinci vardiya -> anlamlı çakışma hatası");
    const s4 = await req('POST', '', {
        name: "Gece Vardiyası", // Daha önce oluşturduk
        startTime: "23:00:00",
        endTime: "07:00:00",
        breakMinutes: 30,
        lateToleranceMinutes: 10,
        earlyExitToleranceMinutes: 10
    });
    console.log("Status:", s4.status, s4.data);

    console.log("\n5. Kullanımda olmayan vardiyayı sil -> başarılı");
    // s2'yi silelim
    if (s2Id) {
        const s5 = await req('DELETE', `/${s2Id}`);
        console.log("Status:", s5.status, s5.data);
    } else {
        console.log("Gece vardiyası oluşturulamadığı için silme atlanıyor.");
    }

    console.log("\n6. Mola süresi vardiya süresinden uzun (08:00–09:00, 90 dk mola) -> doğrulama hatası");
    const s6 = await req('POST', '', {
        name: "Kısa Vardiya",
        startTime: "08:00:00",
        endTime: "09:00:00",
        breakMinutes: 90,
        lateToleranceMinutes: 0,
        earlyExitToleranceMinutes: 0
    });
    console.log("Status:", s6.status, s6.data);
}

run();
