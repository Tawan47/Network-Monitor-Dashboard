const db = require("./db");
const bcrypt = require("bcryptjs");

async function seed() {
    try {
        console.log("🌱 Seeding devices & users...");

        // Ensure schema exists (Migration)
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

        // Clear existing
        await db.query("DELETE FROM alerts");
        await db.query("DELETE FROM history");
        await db.query("DELETE FROM devices");
        await db.query("DELETE FROM users"); // Clear users too for verify clarity

        // Seed Admin User
        const hashedPassword = await bcrypt.hash("admin123", 10);
        await db.query(
            "INSERT INTO users (username, password_hash) VALUES ($1, $2)",
            ["admin", hashedPassword]
        );
        console.log("👤 Admin user created (admin / admin123)");

        const devices = [
            {
                name: "Core Router",
                host: "1.1.1.1",
                type: "router",
                services: []
            },
            {
                name: "Google DNS",
                host: "8.8.8.8",
                type: "server",
                services: []
            },
            {
                name: "Google Web",
                host: "google.com",
                type: "website",
                services: [
                    { name: "HTTPS", port: 443, type: "tcp" }
                ]
            },
            {
                name: "Local Postgres",
                host: "localhost",
                type: "database",
                services: [
                    { name: "PostgreSQL", port: 5432, type: "tcp" },
                    { name: "SSH", port: 22, type: "tcp" }
                ]
            },
            {
                name: "Bad Website",
                host: "this-does-not-exist.com",
                type: "website",
                services: []
            }
        ];

        for (const d of devices) {
            await db.query(
                "INSERT INTO devices (name, host, type, services) VALUES ($1,$2,$3,$4)",
                [d.name, d.host, d.type, JSON.stringify(d.services)]
            );
        }

        console.log("✅ Seed completed (Devices + Users)!");
        process.exit(0);
    } catch (err) {
        console.error("❌ Seed failed", err);
        process.exit(1);
    }
}

seed();
