process.setMaxListeners(0)

console.log("=== 🚀 node-zklib ===")

const ip = "192.168.3.200"   // ganti sesuai IP mesin Anda
const port = 4370
const inport = 5200
const timeout = 5000

// ========================
// 1. node-zklib
// ========================
async function testNodeZKLib() {
    console.log("\n=== [1] node-zklib ===")
    try {
        const ZKLib = require('node-zklib')
        let zk = new ZKLib(ip, port, inport, timeout)
        await zk.createSocket()
        console.log("✅ Tersambung node-zklib")

        const info = await zk.getInfo()
        console.log("ℹ️ Info:", info)

        const logs = await zk.getAttendances()
        console.log("📌 Attendance:", logs?.data?.slice(-5)) // ambil 5 terakhir

        zk.getRealTimeLogs((log) => {
            console.log("📡 Realtime log (node-zklib):", log)
        })

    } catch (err) {
        console.error("❌ node-zklib gagal:", err.message)
    }
}

// ========================
// JALANKAN SEMUA
// ========================
async function runAll() {
    await testNodeZKLib()
}

runAll()