// clear-log.js
const ZKLib = require('node-zklib') // atau 'zklib-js'

const DEVICE_IP = '192.168.3.200'
const PORT = 4370
const INPORT = 5200
const TIMEOUT = 5000

async function clearAttendance() {
    const zk = new ZKLib(DEVICE_IP, PORT, INPORT, TIMEOUT)
    try {
        await zk.createSocket()
        console.log('✅ Connected to device', DEVICE_IP)

        await zk.clearAttendanceLog()
        console.log('🧹 Attendance logs cleared successfully')

        await zk.disconnect()
        console.log('🔌 Disconnected')
    } catch (err) {
        console.error('❌ Error:', err.message || err)
        try { await zk.disconnect() } catch (_) {}
    }
}

clearAttendance()