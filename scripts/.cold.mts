import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
neonConfig.webSocketConstructor = WebSocket;
// Raw adapter client (no retry) to see the exact cold-start error, if any.
const raw = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 15_000, max: 10 }), log: [] });
const t = Date.now();
try { await raw.listing.count(); console.log(`cold query OK in ${Date.now() - t}ms`); }
catch (e) { console.log(`cold query FAILED after ${Date.now() - t}ms`); console.log("class:", e?.constructor?.name, "| code:", (e as any)?.code, "| name:", (e as any)?.name); console.log("message:", String((e as any)?.message).slice(0, 400)); console.log("cause:", String((e as any)?.cause?.message ?? (e as any)?.meta ? JSON.stringify((e as any).meta) : "").slice(0, 300)); }
await raw.$disconnect();
