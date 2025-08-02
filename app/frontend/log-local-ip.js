const os = require('os');
const port = process.env.PORT || 3008;
function getLocalIp() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name] || []) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}
console.log(`[Frontend] Access from your local network: http://${getLocalIp()}:${port}`);
