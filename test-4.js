process.setMaxListeners(0)

console.log("=== 🚀 zkh-lib ===")

const ip = "192.168.3.200"   // ganti sesuai IP mesin Anda
const port = 4370

async function testZKHLib() {
    console.log("\n=== [4] zkh-lib ===")
    try {
        const ZKH = require('zkh-lib')
        const zk = new ZKH(ip, port)

        // langsung panggil fungsi tanpa connect()
        const users = await zk.getUsers()
        console.log("👥 Users:", users?.slice(0, 3))

        const logs = await zk.getAttendances()
        console.log("📌 Attendance:", logs?.slice(-5))

    } catch (err) {
        console.error("❌ zkh-lib gagal:", err.message)
    }
}

testZKHLib()