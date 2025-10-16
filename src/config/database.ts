import mongoose from "mongoose";
import { config } from "../../config/environment";

class Database {
  private static instance: Database;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(): Promise<void> {
    try {
      if (config.mongoUri) {
        await mongoose.connect(config.mongoUri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });

        mongoose.connection.on("connected", () => {
          console.log("📦 Connected to MongoDB");
        });

        mongoose.connection.on("error", (error) => {
          console.error("❌ MongoDB connection error:", error);
        });

        mongoose.connection.on("disconnected", () => {
          console.log("📦 Disconnected from MongoDB");
        });

        // Graceful shutdown
        process.on("SIGINT", async () => {
          await mongoose.connection.close();
          console.log("📦 MongoDB connection closed due to app termination");
          process.exit(0);
        });
      }
    } catch (error) {
      console.error("❌ Database connection failed:", error);
      process.exit(1);
    }
  }

  public async disconnect(): Promise<void> {
    await mongoose.connection.close();
  }
}

export const database = Database.getInstance();
