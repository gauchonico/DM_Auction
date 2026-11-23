import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";

/**
 * Database client.
 *
 * Transport (DATABASE_TRANSPORT):
 * - "websocket" (default): Neon's serverless driver over WebSockets on port 443, via
 *   Prisma's Neon driver adapter. Works on networks that block or throttle Postgres
 *   port 5432 (common on corporate/office networks) and on serverless hosts.
 * - "tcp": Prisma's native TCP connection on port 5432. Fine on most servers.
 *
 * Either way the app uses the pooled DATABASE_URL. Schema changes (`prisma db push`,
 * `prisma migrate`) always use TCP via DATABASE_URL_UNPOOLED, so they need a network
 * where port 5432 is open.
 */

const log: Prisma.LogLevel[] = ["warn"]; // errors surface as thrown exceptions; see retry below

/** For TCP: tolerate Neon cold starts and never hang on a dropped socket. */
function withTcpTimeouts(url: string | undefined): string | undefined {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connect_timeout")) parsed.searchParams.set("connect_timeout", "15");
    if (!parsed.searchParams.has("pool_timeout")) parsed.searchParams.set("pool_timeout", "30");
    if (!parsed.searchParams.has("socket_timeout")) parsed.searchParams.set("socket_timeout", "20");
    return parsed.toString();
  } catch {
    return url;
  }
}

function createBaseClient(): PrismaClient {
  const url = process.env.DATABASE_URL;
  if (process.env.DATABASE_TRANSPORT === "tcp") {
    return new PrismaClient({ datasourceUrl: withTcpTimeouts(url), log });
  }
  // Node 22+ ships a global WebSocket; the serverless driver uses it for its connection pool.
  if (!neonConfig.webSocketConstructor && typeof WebSocket !== "undefined") {
    neonConfig.webSocketConstructor = WebSocket;
  }
  const adapter = new PrismaNeon({ connectionString: url, connectionTimeoutMillis: 15_000, max: 10 });
  return new PrismaClient({ adapter, log });
}

/**
 * Retry policy for transient connection problems (Neon cold starts, flaky networks,
 * and pooled connections that died when the machine switched networks):
 * - Failures while *establishing* a connection: the statement never ran, so any
 *   operation (read or write) is retried.
 * - A connection that drops *mid-query*: only reads are retried — repeating a read is
 *   harmless, but a write might already have been applied.
 */
const MAX_ATTEMPTS = 3;
const CONNECT_FAILURE = /can't reach database server|timeout exceeded when trying to connect|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|websocket.*(error|closed)|connection attempt failed/i;
const CONNECTION_LOST = /connection (terminated|closed|ended|reset)|terminated unexpectedly|ECONNRESET|EPIPE|socket hang up|socket (closed|ended)|websocket|server closed the connection|Client has encountered a connection error|ConnectionClosed|P1017/i;
const READ_OPERATIONS = new Set([
  "findUnique", "findUniqueOrThrow", "findFirst", "findFirstOrThrow", "findMany",
  "count", "aggregate", "groupBy", "$queryRaw",
]);

function errorText(error: unknown): string {
  if (!(error instanceof Error)) return String(error);
  const cause = (error as { cause?: unknown }).cause;
  const code = (error as { code?: unknown }).code;
  return [error.name, error.message, typeof code === "string" ? code : "", cause instanceof Error ? cause.message : ""].join(" ");
}

function isRetryable(error: unknown, operation: string): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P1001") return true;
  const text = errorText(error);
  if (CONNECT_FAILURE.test(text)) return true;
  return READ_OPERATIONS.has(operation) && CONNECTION_LOST.test(text);
}

/** Exported so the retry behaviour can be exercised in isolation. */
export const retryExtension = Prisma.defineExtension({
  name: "retry-unreachable",
  query: {
      async $allOperations({ args, query, operation, model }) {
        for (let attempt = 1; ; attempt++) {
          try {
            const result = await query(args);
            if (attempt > 1) console.warn(`[db] ${model ?? ""}.${operation} recovered on attempt ${attempt}`);
            return result;
          } catch (error) {
            if (attempt >= MAX_ATTEMPTS || !isRetryable(error, operation)) throw error;
            console.warn(`[db] ${model ?? ""}.${operation}: database connection problem (${errorText(error).slice(0, 120)}), retrying (${attempt}/${MAX_ATTEMPTS - 1})…`);
            await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** (attempt - 1)));
          }
        }
      },
    },
});

function createClient() {
  return createBaseClient().$extends(retryExtension);
}

type ExtendedPrismaClient = ReturnType<typeof createClient>;
const globalForPrisma = globalThis as unknown as { prisma?: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
