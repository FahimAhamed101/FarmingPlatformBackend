const http = require("http");
const path = require("path");
const fs = require("fs");
const autocannon = require("autocannon");

process.env.SKIP_DB = "true";
process.env.NODE_ENV = "test";
process.env.RATE_LIMIT_MAX = "1000000";
process.env.AUTH_RATE_LIMIT_MAX = "1000000";

const app = require("../src/app");

const PORT = Number(process.env.BENCHMARK_PORT) || 5055;
const HOST = `http://localhost:${PORT}`;

const cases = [
  { name: "Health", path: "/api/health" },
  { name: "API Root", path: "/api" },
  { name: "Swagger Docs", path: "/api/docs/" },
];

const runCase = (target) =>
  new Promise((resolve, reject) => {
    autocannon(
      {
        url: `${HOST}${target.path}`,
        connections: 20,
        duration: 10,
      },
      (err, result) => {
        if (err) {
          return reject(err);
        }

        return resolve({
          name: target.name,
          path: target.path,
          latencyAverageMs: Number(result.latency.average || 0).toFixed(2),
          latencyP975Ms: Number(result.latency.p97_5 || 0).toFixed(2),
          requestsPerSec: Number(result.requests.average || 0).toFixed(2),
          throughputBytesPerSec: Number(result.throughput.average || 0).toFixed(2),
        });
      }
    );
  });

const writeReport = (results) => {
  const reportPath = path.resolve(__dirname, "../docs/BENCHMARK_REPORT.md");
  const now = new Date().toISOString();
  const fastestByLatency = [...results].sort(
    (a, b) => Number(a.latencyAverageMs) - Number(b.latencyAverageMs)
  )[0];
  const strongestByThroughput = [...results].sort(
    (a, b) => Number(b.requestsPerSec) - Number(a.requestsPerSec)
  )[0];

  const rows = results
    .map(
      (item) =>
        `| ${item.name} | \`${item.path}\` | ${item.latencyAverageMs} | ${item.latencyP975Ms} | ${item.requestsPerSec} | ${item.throughputBytesPerSec} |`
    )
    .join("\n");

  const markdown = `# API Benchmark Report\n\nGenerated: ${now}\n\n## Short Summary\n- Scope: Express transport and middleware only. MongoDB was skipped with \`SKIP_DB=true\`.\n- Lowest average latency: ${fastestByLatency.name} at ${fastestByLatency.latencyAverageMs} ms.\n- Highest throughput: ${strongestByThroughput.name} at ${strongestByThroughput.requestsPerSec} req/sec.\n- Result: the API shell is responsive under light local load, but these figures do not represent database-backed production traffic.\n\n## Environment\n- In-process Express server\n- Database skipped (SKIP_DB=true)\n- Tool: autocannon\n- Connections: 20\n- Duration: 10s per route\n\n| Endpoint | Path | Avg Latency (ms) | P97.5 Latency (ms) | Avg Req/Sec | Avg Throughput (bytes/sec) |\n|---|---|---:|---:|---:|---:|\n${rows}\n\n## Notes\n- This report benchmarks API transport and middleware overhead only.\n- For production-grade numbers, run the same script against a fully connected environment with MongoDB and seeded data.\n`;

  fs.writeFileSync(reportPath, markdown, "utf8");
  return reportPath;
};

const server = http.createServer(app);

server.listen(PORT, async () => {
  try {
    const results = [];

    for (const target of cases) {
      // eslint-disable-next-line no-await-in-loop
      const result = await runCase(target);
      results.push(result);
    }

    const reportPath = writeReport(results);
    // eslint-disable-next-line no-console
    console.log(`Benchmark completed. Report: ${reportPath}`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Benchmark failed:", error.message);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
