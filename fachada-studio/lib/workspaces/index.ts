import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db/mongo";

export type Role = "owner" | "admin" | "member";
const RANK: Record<Role, number> = { member: 1, admin: 2, owner: 3 };

type Membership = { workspaceId: ObjectId; userId: ObjectId; role: Role };

export async function createPersonalWorkspace(userId: string, name = "Mi empresa") {
  const db = await getDb();
  const ws = await db.collection("workspaces").insertOne({
    name,
    type: "agente",
    country: null,
    plan: "gratis",
    seats: 1,
    credits: { subscription: 0, topup: 0 },
    createdAt: new Date(),
  });
  await db.collection<Membership>("memberships").insertOne({
    workspaceId: ws.insertedId,
    userId: new ObjectId(userId),
    role: "owner",
  });
  await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: { lastWorkspaceId: ws.insertedId } });
  return ws.insertedId;
}

/** Returns the membership or null. Callers should answer 404 (not 403) on null. */
export async function getMembership(userId: string, workspaceId: string, minRole: Role = "member") {
  if (!ObjectId.isValid(userId) || !ObjectId.isValid(workspaceId)) return null;
  const db = await getDb();
  const m = await db
    .collection<Membership>("memberships")
    .findOne({ userId: new ObjectId(userId), workspaceId: new ObjectId(workspaceId) });
  return m && RANK[m.role] >= RANK[minRole] ? m : null;
}

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createInvite(workspaceId: string, email: string, role: Exclude<Role, "owner">) {
  const db = await getDb();
  const ws = await db.collection("workspaces").findOne({ _id: new ObjectId(workspaceId) });
  if (!ws) return null;
  const members = await db.collection("memberships").countDocuments({ workspaceId: ws._id });
  if (members >= (ws.seats as number)) return { error: "SEAT_LIMIT" as const };
  const token = randomBytes(32).toString("base64url");
  await db.collection("invites").insertOne({
    workspaceId: ws._id,
    email: email.toLowerCase(),
    role,
    tokenHash: hash(token),
    expiresAt: new Date(Date.now() + 7 * 24 * 3600 * 1000),
  });
  return { token };
}

/** Accept requires the signed-in user's email to match the invite email. */
export async function acceptInvite(token: string, userId: string, userEmail: string) {
  const db = await getDb();
  const invite = await db.collection("invites").findOneAndUpdate(
    { tokenHash: hash(token), acceptedAt: { $exists: false }, expiresAt: { $gt: new Date() }, email: userEmail.toLowerCase() },
    { $set: { acceptedAt: new Date() } },
  );
  if (!invite) return null;
  await db.collection<Membership>("memberships").updateOne(
    { workspaceId: invite.workspaceId, userId: new ObjectId(userId) },
    { $setOnInsert: { role: invite.role as Role } },
    { upsert: true },
  );
  return invite.workspaceId.toString();
}
