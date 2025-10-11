// live-reader.js
process.setMaxListeners(0)

const ZKLib = require('node-zklib')
const axios = require('axios')

const DEVICE_IP = '192.168.3.200'
const PORT = 4370
const INPORT = 5200
const TIMEOUT = 5000
const URL = 'https://be.smart-bookingpontianak.com/i-button-reader/amt-auto-status'
// const URL = 'http://localhost:8080/i-button-reader/amt-auto-status'

// konfigurasi
const POLL_DELAY_MS = 3000
const DUPLICATE_WINDOW_MS = 5000
const REALTIME_WAIT_MS = 10000
const RETRY_COUNT = 3

// cache / state
const lastSent = {}
const seenSn = new Set()
const processedKeys = new Set()
const failedLogs = new Set()

// ========== GLOBAL ERROR HANDLER ==========
process.on("uncaughtException", (err) => {
    console.error("💥 Uncaught exception:", err.message)
})
process.on("unhandledRejection", (reason) => {
    console.error("💥 Unhandled rejection:", reason)
})
// ==========================================

async function sendToServer(log) {
    const userId = log.deviceUserId || ''
    if (!userId) throw new Error('empty userId')
    const url = `${URL}/${userId}`
    console.log('➡️ Sending to:', url)
    return axios.get(url, { timeout: 10000 })
}

async function handleLog(log) {
    if (!log) return false
    const sn = log.userSn ?? null
    const userId = log.deviceUserId ?? ''
    if (!userId) {
        console.log('⚠️ skip log tanpa userId:', log)
        return false
    }

    const key = `${userId}-${sn || log.recordTime}`

    // skip kalau sudah pernah diproses
    if (processedKeys.has(key)) {
        console.log(`⚠️ skip already processed: ${key}`)
        return false
    }

    const logTime = new Date(log.recordTime).getTime()
    const last = lastSent[userId] || 0
    if (logTime - last <= DUPLICATE_WINDOW_MS) {
        console.log(`⚠️ skip duplicate time user=${userId} (diff ${logTime - last}ms)`)
        return false
    }

    try {
        await sendToServer(log)
        console.log('✅ Sent:', userId, log.recordTime)
        lastSent[userId] = logTime
        processedKeys.add(key)
        if (sn !== null) seenSn.add(sn)
        return true
    } catch (err) {
        console.error('❌ Failed send for', userId, err.message || err.toString())
        processedKeys.add(key)
        failedLogs.add(key)
        return false
    }
}

async function startHybrid() {
    const zk = new ZKLib(DEVICE_IP, PORT, INPORT, TIMEOUT)

    try {
        await zk.createSocket()
        console.log('✅ Connected to device', DEVICE_IP)

        // ✅ Clear logs saat pertama kali konek
        try {
            console.log('🧹 Clearing logs on startup...')
            await zk.clearAttendanceLog()
            console.log('✅ Logs cleared successfully on startup')
        } catch (err) {
            console.warn('⚠️ Failed to clear logs on startup:', err.message)
        }

        // coba realtime
        let gotRealtime = false
        try {
            zk.getRealTimeLogs(async (err, log) => {
                if (err) {
                    console.warn('Realtime error:', err)
                    return
                }
                gotRealtime = true
                console.log('📡 Realtime log:', log)
                await handleLog(log)
            })
        } catch (e) {
            console.warn('Realtime setup error:', e.message || e)
        }

        await sleep(REALTIME_WAIT_MS)

        if (!gotRealtime) {
            console.log('⚠️ Realtime not detected — fallback to polling')
            await pollingLoop(zk)
        } else {
            console.log('ℹ️ Realtime aktif — hanya listen')
        }

    } catch (e) {
        console.error('❌ Error connecting:', e.message || e)
        try { await zk.disconnect() } catch (_) {}
        await sleep(5000)
        return startHybrid() // auto reconnect
    }
}

async function pollingLoop(zkInstance) {
    console.log('🔁 Polling loop started')
    while (true) {
        try {
            let logsResponse
            let success = false

            // retry mechanism
            for (let i = 0; i < RETRY_COUNT; i++) {
                try {
                    logsResponse = await zkInstance.getAttendances()
                    if (logsResponse?.data) {
                        success = true
                        break
                    }
                } catch (err) {
                    console.error(`⚠️ getAttendances attempt ${i + 1} failed:`, err.message || err)
                    await sleep(1000)
                }
            }

            if (!success) {
                console.log('❌ getAttendances gagal semua percobaan, tunggu...')
                await tryClearLogsAlways(zkInstance) // ✅ tetap clear logs meski gagal baca
                await sleep(POLL_DELAY_MS)
                continue
            }

            const allLogs = Array.isArray(logsResponse.data) ? logsResponse.data : []
            console.log(`=== RAW LOGS (${allLogs.length}) ===`)
            allLogs.forEach(l => console.log('➡', l.userSn ?? '-', l.deviceUserId, l.recordTime))

            // filter log unik
            const toProcess = []
            for (const log of allLogs) {
                const key = `${log.deviceUserId}-${log.userSn || log.recordTime}`
                if (!log.deviceUserId) continue
                if (processedKeys.has(key)) continue
                const lt = new Date(log.recordTime).getTime()
                const last = lastSent[log.deviceUserId] || 0
                if (lt - last <= DUPLICATE_WINDOW_MS) continue
                toProcess.push(log)
            }

            console.log(`=== FILTERED (${toProcess.length}) ===`)
            toProcess.forEach(l => console.log('->', l.userSn ?? '-', l.deviceUserId, l.recordTime))

            // kirim log
            let allSent = true
            for (const log of toProcess) {
                const ok = await handleLog(log)
                if (!ok) allSent = false
            }

            // ✅ SELALU CLEAR LOGS, apapun hasilnya
            await tryClearLogsAlways(zkInstance)

        } catch (outerErr) {
            console.error('❌ Polling error:', outerErr.message || outerErr)
        }

        await sleep(POLL_DELAY_MS)
    }
}

async function tryClearLogsAlways(zkInstance) {
    try {
        console.log('🧹 Attempting to clear logs from device...')
        await zkInstance.clearAttendanceLog()
        console.log('✅ Device logs cleared')
        seenSn.clear()
    } catch (err) {
        console.warn('⚠️ Failed to clear device logs:', err.message)
    }
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms))
}

startHybrid().catch(err => console.error('FATAL:', err))