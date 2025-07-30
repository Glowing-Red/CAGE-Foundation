const fs = require("fs");
const path = require("path");

const anomaliesPath = path.join(__dirname, "Assets", "Anomalies");
const outputPath = path.join(anomaliesPath, "List.json");

const directories = fs.readdirSync(anomaliesPath).filter(item => {
    const itemPath = path.join(anomaliesPath, item);

    return fs.statSync(itemPath).isDirectory();
});

fs.writeFileSync(outputPath, JSON.stringify(directories, null, 2));
console.log(`Created anomalies.json with ${directories.length} entries.`);