import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directory = path.join(__dirname, "pages");

const includeRegex = /<[A-Z][a-zA-Z0-9]*[^I][^c][^o][^n]\s+className=/;
const excludeWords = [
  "XAxis", "YAxis", "CartesianGrid", "Tooltip", "Legend", "ResponsiveContainer",
  "LineChart", "BarChart", "AreaChart", "PieChart", "ScatterChart",
  "Cell", "Line", "Bar", "Area", "Pie", "FunnelIcon", "Scatter", "PlusIcon"
];

function scanFiles(dir) {
  let results = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results = results.concat(scanFiles(fullPath));
    } else if (entry.name.endsWith(".tsx")) {
      const lines = fs.readFileSync(fullPath, "utf8").split("\n");

      lines.forEach((line, index) => {
        if (includeRegex.test(line)) {
          if (!excludeWords.some(w => line.includes(w))) {
            results.push({
              file: fullPath.replace(__dirname + path.sep, ""),
              lineNumber: index + 1,
              line: line.trim()
            });
          }
        }
      });
    }
  }

  return results;
}

const output = scanFiles(directory);
fs.writeFileSync("output.json", JSON.stringify(output, null, 2));
console.log(`✅ Done! Found ${output.length} matches. Saved to output.json`);
