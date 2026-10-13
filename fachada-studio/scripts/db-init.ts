// Idempotent index creation. Run: pnpm db:init (needs MONGODB_URI).
import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) throw new Error("MONGODB_URI is not set");
const dbName = process.env.MONGODB_DB ?? "fachada-studio";

const client = await new MongoClient(uri).connect();
const db = client.db(dbName);

await db.collection("workspaces").createIndex({ stripeCustomerId: 1 }, { unique: true, sparse: true });
await db.collection("memberships").createIndex({ workspaceId: 1, userId: 1 }, { unique: true });
await db.collection("memberships").createIndex({ userId: 1 });
await db.collection("invites").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
await db.collection("invites").createIndex({ workspaceId: 1, email: 1 });
await db.collection("brand_kits").createIndex({ workspaceId: 1 });
await db.collection("properties").createIndex({ workspaceId: 1, updatedAt: -1 });
await db.collection("media").createIndex({ propertyId: 1, order: 1 });
await db.collection("generations").createIndex({ workspaceId: 1, createdAt: -1 });
await db.collection("generations").createIndex({ propertyId: 1, createdAt: -1 });
await db.collection("generations").createIndex({ hfRequestId: 1 }, { unique: true, sparse: true });
await db.collection("generations").createIndex({ status: 1, updatedAt: 1 });
await db.collection("credit_ledger").createIndex({ reason: 1, refType: 1, refId: 1 }, { unique: true });
await db.collection("credit_ledger").createIndex({ workspaceId: 1, createdAt: -1 });
await db.collection("hf_webhook_events").createIndex({ requestId: 1, status: 1 }, { unique: true });
await db.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
await db.collection("tool_config").createIndex({ slug: 1 }, { unique: true });
await db.collection("model_pricing").createIndex({ modelId: 1 }, { unique: true });

console.log("Indexes ready on", dbName);
await client.close();
