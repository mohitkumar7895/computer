import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONNGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable. Please add it to your .env file or Vercel Environment Variables.");
}

// Extend the NodeJS global type to cache the mongoose connection
declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null };
}

let cached = global._mongooseCache;

if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

export async function connectDB() {
  try {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000, // Timeout after 5s
      };
      cached.promise = mongoose.connect(MONGODB_URI as string, opts);
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e: any) {
    cached.promise = null; // Reset promise so we can retry
    console.error("MONGODB CONNECTION ERROR:", e.message);
    throw new Error(`DB_CONNECTION_FAILED: ${e.message}`);
  }
}
