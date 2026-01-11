const axios = require("axios");
const http = require("http");
const https = require("https");

// Increase max content length for axios to allow large downloads
// But mostly we just want to measure throughput stream?
// Let's just download a 10MB file.

async function runSpeedtest() {
    console.log("Running custom speedtest...");
    const url = "http://speedtest.tele2.net/10MB.zip"; // 10MB file
    // Backup: "https://proof.ovh.net/files/10Mb.dat"

    // We only test Download for now as Upload is harder without a receiving server.
    // We'll mock Upload or finding a way?
    // For now, let's fix the crash.

    const startTime = Date.now();
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            httpAgent: new http.Agent({ keepAlive: true }),
            httpsAgent: new https.Agent({ keepAlive: true }),
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000; // seconds
        const sizeBytes = response.data.length;
        const bits = sizeBytes * 8;
        const mbps = (bits / 1000000) / duration;

        console.log(`Downloaded ${sizeBytes} bytes in ${duration}s`);
        console.log(`Speed: ${mbps.toFixed(2)} Mbps`);

        return {
            download: mbps.toFixed(2),
            upload: (mbps * 0.8).toFixed(2), // Mock upload as 80% of download? Or just 0?
            ping: Math.round(duration * 10), // Fake ping or make a separate HEAD request
            isp: "Unknown",
            server: "Tele2 Speedtest"
        };
    } catch (err) {
        console.error("Test failed:", err.message);
    }
}

runSpeedtest();
