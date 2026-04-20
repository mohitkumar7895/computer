import mongoose from "mongoose";

/**
 * MongoDB Connection Utility
 * Corrected to ensure proper module exports for Next.js 16+ Turbopack
 */

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONNGODB_URI;

if (!MONGODB_URI) {
  throw new Error("Missing MONGODB_URI environment variable. Please add it to your .env file or Vercel Environment Variables.");
}

// Global cache to prevent multiple connections in development
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const globalWithMongoose = global as any;

if (!globalWithMongoose._mongooseCache) {
  globalWithMongoose._mongooseCache = { conn: null, promise: null };
}

const cached = globalWithMongoose._mongooseCache;

export async function connectDB() {
  try {
    if (cached.conn) {
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        serverSelectionTimeoutMS: 5000,
      };
      cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((m) => m);
    }

    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e: any) {
    cached.promise = null;
    console.error("MONGODB CONNECTION ERROR:", e.message);
    throw new Error(`DB_CONNECTION_FAILED: ${e.message}`);
  }
}

// Default export for compatibility
export default connectDB;
