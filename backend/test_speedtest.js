const speedTest = require("speedtest-net");

async function run() {
    try {
        console.log("Running speedtest...");
        const result = await speedTest({ acceptLicense: true, acceptGdpr: true });
        console.log("Result:", result);
    } catch (err) {
        console.error("Error:", err);
    }
}

run();
