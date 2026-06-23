const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const source = path.join(root, "assets");
const destination = path.join(root, "public", "assets");

if (!fs.existsSync(source)) throw new Error(`Missing assets directory: ${source}`);
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.cpSync(source, destination, { recursive: true });
console.log("Synced assets to public/assets");
