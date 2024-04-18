const DB_NAME = 'ecom'

import { networkInterfaces } from 'os';

function getIPAddress() {
    const interfaces = networkInterfaces();
    for (const interfaceName in interfaces) {
        const interfaceInfo = interfaces[interfaceName];
        for (const iface of interfaceInfo) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return '127.0.0.1'; 
}

const IP = getIPAddress();
console.log("Dynamic IP address:", IP);

const redirectURL = 'https://developers.google.com/oauthplayground';


export {
    DB_NAME,
    IP,
    redirectURL
}