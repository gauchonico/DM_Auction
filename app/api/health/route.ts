import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkBucket } from "@/lib/storage";

export const dynamic = "force-dynamic";

type Check = { ok: true; ms: number } | { ok: false; ms: number; error: string };

async function timed(fn: () => Promise<unknown>): Promise<Check> {
  const start = Date.now();
  try {
    await fn();
    return { ok: true, ms: Date.now() - start };
  } catch (error) {
    // Error names only: never leak connection strings or credentials.
    const name = error instanceof Error ? error.name : "UnknownError";
    return { ok: false, ms: Date.now() - start, error: name };
  }
}

/** Liveness of Neon Postgres and Neon Object Storage. */
export async function GET() {
  const [postgres, storage] = await Promise.all([
    timed(() => prisma.$queryRaw`SELECT 1`),
    timed(() => checkBucket()),
  ]);
  const ok = postgres.ok && storage.ok;
  return NextResponse.json(
    { ok, postgres, storage },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
