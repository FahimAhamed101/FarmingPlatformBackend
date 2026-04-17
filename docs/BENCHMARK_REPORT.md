# API Benchmark Report

Generated: 2026-04-17T21:59:39.519Z

## Short Summary
- Scope: Express transport and middleware only. MongoDB was skipped with `SKIP_DB=true`.
- Lowest average latency: API Root at 14.54 ms.
- Highest throughput: API Root at 1335.90 req/sec.
- Result: the API shell is responsive under light local load, but these figures do not represent database-backed production traffic.

## Environment
- In-process Express server
- Database skipped (SKIP_DB=true)
- Tool: autocannon
- Connections: 20
- Duration: 10s per route

| Endpoint | Path | Avg Latency (ms) | P97.5 Latency (ms) | Avg Req/Sec | Avg Throughput (bytes/sec) |
|---|---|---:|---:|---:|---:|
| Health | `/api/health` | 22.55 | 81.00 | 876.00 | 1029568.00 |
| API Root | `/api` | 14.54 | 39.00 | 1335.90 | 1654067.20 |
| Swagger Docs | `/api/docs/` | 29.92 | 67.00 | 661.90 | 2726502.40 |

## Notes
- This report benchmarks API transport and middleware overhead only.
- For production-grade numbers, run the same script against a fully connected environment with MongoDB and seeded data.
