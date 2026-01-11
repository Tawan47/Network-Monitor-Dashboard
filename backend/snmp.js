const snmp = require("net-snmp");

const TARGET = process.env.SNMP_HOST;
const COMMUNITY = process.env.SNMP_COMMUNITY;
const IF_INDEX = process.env.SNMP_IF_INDEX; // เช่น 1

const session = snmp.createSession(TARGET, COMMUNITY);

let last = null;

const OIDS = {
    in: `1.3.6.1.2.1.2.2.1.10.${IF_INDEX}`, // ifInOctets
    out: `1.3.6.1.2.1.2.2.1.16.${IF_INDEX}`, // ifOutOctets
};

function pollBandwidth(interval = 3) {
    return new Promise((resolve) => {
        session.get([OIDS.in, OIDS.out], (err, varbinds) => {
            if (err) {
                console.error("SNMP error:", err);
                return resolve({ inMbps: 0, outMbps: 0 });
            }

            const now = {
                rx: varbinds[0].value,
                tx: varbinds[1].value,
            };

            if (!last) {
                last = now;
                return resolve({ inMbps: 0, outMbps: 0 });
            }

            const inMbps = ((now.rx - last.rx) * 8) / (interval * 1e6);
            const outMbps = ((now.tx - last.tx) * 8) / (interval * 1e6);

            last = now;

            resolve({
                inMbps: +inMbps.toFixed(2),
                outMbps: +outMbps.toFixed(2),
            });
        });
    });
}

module.exports = { pollBandwidth };
