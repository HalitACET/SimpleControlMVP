const url = 'http://localhost:8080/auth/login';

async function run() {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firmId: 'ATLAS01', username: 'mehmet.yilmaz', password: 'password123' })
    });
    console.log(res.status, await res.text());
}
run();
