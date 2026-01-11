const ping = require("ping");
const db = require("./db");

async function checkDevice(device) {
    const res = await ping.promise.probe(device.host, { timeout: 2 });

    const latency = res.time || 0;
    const status = res.alive
        ? latency > 300 ? "warning" : "online"
        : "offline";

    await db.query(
        "INSERT INTO history (device_id, latency, status) VALUES ($1,$2,$3)",
        [device.id, latency, status]
    );

    return { ...device, latency, status };
}

module.exports = checkDevice;
