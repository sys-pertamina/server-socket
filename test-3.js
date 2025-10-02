process.setMaxListeners(0)

console.log("=== 🚀 zkteco-js ===")

const ip = "192.168.3.200"   // ganti sesuai IP mesin Anda
const port = 4370
const timeout = 5000

async function testZKTecoJS() {
    console.log("\n=== [3] zkteco-js ===")
    try {
        const ZK = require('zkteco-js')   // ✅ class langsung
        const zk = new ZK(ip, port, timeout) // ✅ parameter langsung

        await zk.connect()
        console.log("✅ Tersambung zkteco-js")

        const users = await zk.getUsers()
        console.log("👥 Users:", users?.slice(0, 3))

        const logs = await zk.getAttendance()
        console.log("📌 Attendance:", logs?.slice(-5))

        // listen realtime log
        zk.on("attendance", (log) => {
            console.log("📡 Realtime log (zkteco-js):", log)
        })

    } catch (err) {
        console.error("❌ zkteco-js gagal:", err.message)
    }
}

testZKTecoJS()