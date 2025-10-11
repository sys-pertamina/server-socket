const ZKLib = require('node-zklib');

(async () => {
    try {
        // inisialisasi koneksi ke mesin
        const zkInstance = new ZKLib('192.168.3.200', 4370, 10000, 4000);

        // buka koneksi
        await zkInstance.createSocket();
        console.log('✅ Terhubung ke mesin X105');

        // ambil semua log absensi
        const logs = await zkInstance.getAttendances();
        console.log('📋 Data Absensi:', logs.data);

        // contoh: iterasi dan tampilkan
        logs.data.forEach(log => {
            console.log(`UserID: ${log.userId}, Waktu: ${log.timestamp}`);
        });

        // tutup koneksi setelah selesai
        await zkInstance.disconnect();
    } catch (err) {
        console.error('❌ Error:', err);
    }
})();