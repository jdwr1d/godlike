import "server-only";
import { MongoClient, type Db } from "mongodb";
import { env } from "@/lib/env";

const globalForMongo = globalThis as unknown as {
  _mongoClient?: Promise<MongoClient>;
};

export function getClient(): Promise<MongoClient> {
  if (!env.MONGODB_URI) throw new Error("MONGODB_URI is not set");
  globalForMongo._mongoClient ??= new MongoClient(env.MONGODB_URI).connect();
  return globalForMongo._mongoClient;
}

export async function getDb(): Promise<Db> {
  return (await getClient()).db(env.MONGODB_DB);
}
