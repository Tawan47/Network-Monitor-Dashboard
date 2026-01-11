require("dotenv").config();
const express = require("express");
const cors = require("cors");
const WebSocket = require("ws");
const ping = require("ping");
const http = require("http");
const net = require("net");
const { Parser } = require("json2csv");
const { sendNotification } = require("./notify");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { authenticateToken, SECRET_KEY } = require("./auth"); // Import Auth

const db = require("./db");
const FastSpeedtest = require("fast-speedtest-api");


const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// HTTP + WebSocket Server
// ===============================
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// ===============================
// Load devices from Neon
// ===============================
let devices = [];

async function loadDevices() {
    try {
        // Migration: Add columns if not exist
        await db.query(`
            ALTER TABLE devices 
            ADD COLUMN IF NOT EXISTS type VARCHAR(50) DEFAULT 'server',
            ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'
        `);

        // Create Alerts Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS alerts (
                id SERIAL PRIMARY KEY,
                device_id INTEGER REFERENCES devices(id),
                type VARCHAR(50),
                message TEXT,
                status VARCHAR(50) DEFAULT 'active', -- active, acknowledged, resolved
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ack_at TIMESTAMP
            )
        `);

        // Create Users Table
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash TEXT NOT NULL
            )
        `);

        const res = await db.query("SELECT * FROM devices ORDER BY id");

        devices = res.rows.map((d) => ({
            ...d,
            status: "unknown",
            latency: 0,
            packetLoss: 0,
            servicesStatus: [], // Store real-time service status
        }));

        console.log("📡 Devices loaded:", devices.length);
    } catch (err) {
        console.error("❌ Failed to load devices", err);
    }
}

// ===============================
// REST API
// ===============================
app.get("/api/devices", (req, res) => {
    res.json(devices);
});

app.post("/api/devices", authenticateToken, async (req, res) => {
    try {
        // type: server, router, switch, website
        // services: [{ name: 'HTTP', port: 80, type: 'tcp' }]
        const { name, host, type = 'server', services = [] } = req.body;

        const r = await db.query(
            "INSERT INTO devices (name, host, type, services) VALUES ($1,$2,$3,$4) RETURNING *",
            [name, host, type, JSON.stringify(services)]
        );

        const device = {
            ...r.rows[0],
            status: "unknown",
            latency: 0,
            packetLoss: 0,
            servicesStatus: [],
            uptime: 100,
            downtime: 0
        };

        devices.push(device);
        res.json(device);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to add device" });
    }
});

app.delete("/api/devices/:id", async (req, res) => {
    try {
        const id = req.params.id;

        await db.query("DELETE FROM devices WHERE id=$1", [id]);
        devices = devices.filter((d) => d.id != id);

        res.json({ ok: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete device" });
    }
});

app.get("/api/devices/:id/incidents", async (req, res) => {
    try {
        const id = req.params.id;

        // Fetch last 24h history
        const result = await db.query(
            `SELECT status, created_at FROM history 
             WHERE device_id = $1 
             AND created_at > NOW() - INTERVAL '24 hours'
             ORDER BY created_at ASC`,
            [id]
        );

        const rows = result.rows;
        const incidents = [];
        let ongoingIncident = null;

        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            const isDown = row.status === "offline";

            if (isDown && !ongoingIncident) {
                ongoingIncident = {
                    start: row.created_at,
                    end: null,
                    duration: 0,
                };
            } else if (!isDown && ongoingIncident) {
                ongoingIncident.end = row.created_at;
                const start = new Date(ongoingIncident.start);
                const end = new Date(ongoingIncident.end);
                const durationMins = Math.round((end - start) / 60000);

                if (durationMins >= 0) {
                    ongoingIncident.duration = durationMins;
                    incidents.push(ongoingIncident);
                }
                ongoingIncident = null;
            }
        }

        if (ongoingIncident) {
            ongoingIncident.end = new Date();
            ongoingIncident.duration = Math.round((ongoingIncident.end - new Date(ongoingIncident.start)) / 60000);
            ongoingIncident.isOpen = true;
            incidents.push(ongoingIncident);
        }

        res.json(incidents.reverse());
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch incidents" });
    }
});

// ===============================
// Dashboard History (Aggregated)
// ===============================
app.get("/api/dashboard/history", authenticateToken, async (req, res) => {
    try {
        // Aggregate last 3 hours (180 minutes)
        const result = await db.query(
            `SELECT 
                date_trunc('minute', created_at) as time,
                ROUND(AVG(latency)::numeric, 2) as avg_latency,
                COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_count
             FROM history 
             WHERE created_at > NOW() - INTERVAL '3 hours'
             GROUP BY 1
             ORDER BY 1 ASC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Dashboard history error:", err);
        res.status(500).json({ error: "Failed to fetch dashboard history" });
    }
});

// ===============================
// Tools
// ===============================
app.get("/api/speedtest", async (req, res) => {
    try {
        const speedtest = new FastSpeedtest({
            token: "YXNkZmFzZGxmbnNkYWZoYXNkZmhrYWxm", // Public token
            verbose: false,
            timeout: 10000,
            https: true,
            urlCount: 5,
            bufferSize: 8,
            unit: FastSpeedtest.UNITS.Mbps
        });

        const speed = await speedtest.getSpeed();
        res.json({
            speed: Math.round(speed),
            unit: "Mbps",
            isDone: true
        });

    } catch (err) {
        console.error("Speedtest error:", err);
        res.status(500).json({ error: "Speedtest failed" });
    }
});

// ===============================
// Auth & Logs
// ===============================

app.post("/api/login", async (req, res) => {
    try {
        const { username, password } = req.body;
        const result = await db.query("SELECT * FROM users WHERE username = $1", [username]);
        const user = result.rows[0];

        if (!user) return res.status(401).json({ error: "Invalid credentials" });

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) return res.status(401).json({ error: "Invalid credentials" });

        const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: '1h' });
        res.json({ token, username });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});

// Logs & Export
// ----------------------------

// Helper to build log query
function buildLogQuery(filters) {
    let query = `
        SELECT h.id, h.created_at, h.status, h.latency, d.name as device_name, d.type as device_type, d.host
        FROM history h
        JOIN devices d ON h.device_id = d.id
        WHERE 1=1
    `;
    const params = [];
    let paramIdx = 1;

    if (filters.status && filters.status !== 'all') {
        query += ` AND h.status = $${paramIdx++}`;
        params.push(filters.status);
    }

    if (filters.deviceId && filters.deviceId !== 'all') {
        query += ` AND h.device_id = $${paramIdx++}`;
        params.push(filters.deviceId);
    }

    // Default sort
    query += ` ORDER BY h.created_at DESC`;

    return { query, params };
}

app.get("/api/logs", authenticateToken, async (req, res) => {
    try {
        const { page = 1, limit = 50, status, deviceId } = req.query;
        const offset = (page - 1) * limit;

        const { query, params } = buildLogQuery({ status, deviceId });

        // Add pagination
        const pagedQuery = query + ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        const pagedParams = [...params, limit, offset];

        const result = await db.query(pagedQuery, pagedParams);

        // Get total count (approximate)
        // For perf, maybe we don't count everything everytime? 
        // Let's do a simple count for now.
        // Re-use WHERE clause potentially? 
        // Simplified: just return rows for now. Frontend can handle infinite scroll or simple buttons.

        res.json(result.rows);
    } catch (err) {
        console.error("Logs error:", err);
        res.status(500).json({ error: "Failed to fetch logs" });
    }
});

app.get("/api/logs/export", async (req, res) => {
    try {
        const { status, deviceId } = req.query;
        const { query, params } = buildLogQuery({ status, deviceId });

        // Limit export to last 10000 to prevent crash? Or stream?
        // Let's limit to 5000 for safety in this demo.
        const exportQuery = query + ` LIMIT 5000`;

        const result = await db.query(exportQuery, params);
        const logs = result.rows;

        if (logs.length === 0) {
            return res.status(404).send("No logs to export");
        }

        // Convert to CSV
        const fields = ['created_at', 'device_name', 'device_type', 'host', 'status', 'latency'];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(logs);

        res.header('Content-Type', 'text/csv');
        res.attachment('network_logs.csv');
        return res.send(csv);

    } catch (err) {
        console.error("Export error:", err);
        res.status(500).send("Export failed");
    }
});

// ===============================
// Alerts API
// ===============================

app.get("/api/alerts", authenticateToken, async (req, res) => {
    try {
        const { status } = req.query; // 'active' or 'all'
        let query = `
            SELECT a.*, d.name as device_name, d.host 
            FROM alerts a
            JOIN devices d ON a.device_id = d.id
        `;
        const params = [];

        if (status === 'active') {
            query += ` WHERE a.status = 'active'`;
        }

        query += ` ORDER BY a.created_at DESC LIMIT 100`;

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch alerts error:", err);
        res.status(500).json({ error: "Failed to fetch alerts" });
    }
});

app.post("/api/alerts/:id/ack", authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await db.query(
            "UPDATE alerts SET status = 'acknowledged', ack_at = NOW() WHERE id = $1",
            [id]
        );
        res.json({ success: true });
    } catch (err) {
        console.error("Ack alert error:", err);
        res.status(500).json({ error: "Failed to acknowledge alert" });
    }
});

// ===============================
// New Monitoring Logic
// ===============================

// 1. TCP Port Check
function checkService(host, port, timeout = 2000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);

        socket.on("connect", () => {
            socket.destroy();
            resolve(true); // Open
        });

        socket.on("timeout", () => {
            socket.destroy();
            resolve(false); // Closed/Timeout
        });

        socket.on("error", () => {
            socket.destroy();
            resolve(false); // Error
        });

        socket.connect(port, host);
    });
}

// 2. HTTP Website Check
async function checkWebsite(url) {
    try {
        const start = Date.now();
        // Ensure protocol
        const checkUrl = url.startsWith("http") ? url : `https://${url}`;

        await fetch(checkUrl, { method: "HEAD", signal: AbortSignal.timeout(3000) });
        const lat = Date.now() - start;
        return { online: true, latency: lat };
    } catch (err) {
        return { online: false, latency: 0 };
    }
}

// 3. Ping Wrapper
async function pingWithLoss(host) {
    try {
        const res = await ping.promise.probe(host, { timeout: 2 });
        return {
            online: res.alive,
            latency: res.time || 0,
            packetLoss: res.packetLoss || (res.alive ? 0 : 100),
        };
    } catch (e) {
        return { online: false, latency: 0, packetLoss: 100 };
    }
}

async function calculateSLA(deviceId) {
    try {
        const res = await db.query(
            `SELECT status FROM history 
             WHERE device_id = $1 
             AND created_at > NOW() - INTERVAL '24 hours'`,
            [deviceId]
        );

        if (res.rows.length === 0) return { uptime: 100, downtimeMinutes: 0 };

        const total = res.rows.length;
        const offline = res.rows.filter((r) => r.status === "offline").length;
        // Approx 3s per check
        const downtimeMinutes = Math.round((offline * 3) / 60);
        const uptime = (((total - offline) / total) * 100).toFixed(2);

        return { uptime: +uptime, downtimeMinutes };
    } catch (err) {
        return { uptime: 100, downtimeMinutes: 0 };
    }
}

// ===============================
// Monitor Loop
// ===============================
async function monitor() {
    // console.log("🔁 Monitoring...");

    for (let d of devices) {
        let isOnline = false;
        let latency = 0;
        let packetLoss = 0;

        // 1. Check Device Health (Ping or HTTP)
        if (d.type === 'website') {
            const webRes = await checkWebsite(d.host);
            isOnline = webRes.online;
            latency = webRes.latency;
            packetLoss = isOnline ? 0 : 100;
        } else {
            // Default Ping
            const pingRes = await pingWithLoss(d.host);
            isOnline = pingRes.online;
            latency = typeof pingRes.latency === 'number' ? Math.round(pingRes.latency) : 0;
            packetLoss = Math.round(pingRes.packetLoss);
        }

        d.latency = latency;
        d.packetLoss = packetLoss;

        // Determine Status
        let previousStatus = d.status; // Need to track state change?
        // Note: In this simple loop, d.status is ephemeral. 
        // Real implementations use a localized state map found outside the loop.
        // For this demo, let's assume we read from DB or check in-memory `devices` array 
        // but `devices` is re-fetched on `loadDevices`.
        // We'll update `devices` in-place so next loop knows old status.

        // Simpler Alert Logic:
        // If critical (offline) AND wasn't already alerted/offline? 
        // We need a way to track "Active Alert" for this device to prevent spam.
        // Let's check if there is an ACTIVE alert in DB for this device.

        if (!isOnline) {
            d.status = "offline";
        } else if (latency > 300 || packetLoss > 10) {
            d.status = "warning";
        } else {
            d.status = "online";
        }

        // Alert Triggering
        if (d.status === 'offline') {
            await handleAlert(d, 'offline', `Device ${d.name} (${d.host}) is OFFLINE!`);
        } else if (d.status === 'warning') {
            // Maybe don't spam warning alerts, or only if latency is VERY high
        } else if (d.status === 'online') {
            // Resolve any active offline alerts?
            await resolveAlerts(d);
        }

        // 2. Check Services (if any)
        if (Array.isArray(d.services) && d.services.length > 0) {
            const statusPromises = d.services.map(async (svc) => {
                const portOpen = await checkService(d.host, svc.port);
                return {
                    name: svc.name,
                    port: svc.port,
                    status: portOpen ? "up" : "down"
                };
            });
            d.servicesStatus = await Promise.all(statusPromises);
        } else {
            d.servicesStatus = [];
        }

        // 3. Save History
        await db.query(
            "INSERT INTO history (device_id, latency, status) VALUES ($1,$2,$3)",
            [d.id, d.latency, d.status]
        );
        // 4. Update SLA (In-memory cache for simplicity in loop)
        const sla = await calculateSLA(d.id);
        d.uptime = sla.uptime;
        d.downtime = sla.downtimeMinutes;
    }

    const payload = JSON.stringify(devices);
    wss.clients.forEach(
        (client) =>
            client.readyState === WebSocket.OPEN && client.send(payload)
    );
}

// Helper: Handle Alert Creation (Debounced via DB check)
async function handleAlert(device, type, message) {
    try {
        // Check if active alert exists
        const res = await db.query(
            "SELECT * FROM alerts WHERE device_id = $1 AND status IN ('active', 'acknowledged') AND type = $2",
            [device.id, type]
        );

        if (res.rows.length === 0) {
            // Create new alert
            console.log(`🚨 Generating Alert: ${message}`);
            await db.query(
                "INSERT INTO alerts (device_id, type, message, status) VALUES ($1, $2, $3, 'active')",
                [device.id, type, message]
            );

            // Send Notification
            await sendNotification("Network Alert", message);
        }
    } catch (err) {
        console.error("Error handling alert:", err);
    }
}

// Helper: Resolve Alerts
async function resolveAlerts(device) {
    try {
        const res = await db.query(
            "UPDATE alerts SET status = 'resolved' WHERE device_id = $1 AND status IN ('active', 'acknowledged') RETURNING *",
            [device.id]
        );
        if (res.rows.length > 0) {
            console.log(`✅ Resolved ${res.rows.length} alerts for ${device.name}`);
            await sendNotification("Alert Resolved", `Device ${device.name} is back ONLINE.`);
        }
    } catch (err) {
        console.error("Error resolving alert:", err);
    }
}


// ===============================
// Start
// ===============================
server.listen(3000, async () => {
    console.log("⏳ Starting backend...");
    await loadDevices();
    setInterval(monitor, 3000);
    console.log("🚀 Backend running on http://localhost:3000");
});
