import "server-only";
import { getDb } from "@/lib/db/mongo";

// Fixed-window counter in Mongo (TTL index on `expiresAt`, see db:init).
export async function rateLimit(key: string, limit: number, windowSec: number): Promise<boolean> {
  const db = await getDb();
  const now = Date.now();
  const bucket = Math.floor(now / (windowSec * 1000));
  const res = await db.collection<{ _id: string; count: number; expiresAt: Date }>("rate_limits").findOneAndUpdate(
    { _id: `${key}:${bucket}` },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((bucket + 1) * windowSec * 1000 + 60_000) } },
    { upsert: true, returnDocument: "after" },
  );
  return (res?.count ?? 1) <= limit;
}
