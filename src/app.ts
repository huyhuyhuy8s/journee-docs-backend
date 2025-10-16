import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "../config/environment";
import { corsMiddleware } from "./middleware/cors.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
// import { database } from './config/database'; // Comment out database import
import apiRoutes from "./routes";

class App {
  public app: Application;

  constructor() {
    this.app = express();
    // this.initializeDatabase(); // Comment out database initialization
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  // Comment out database initialization for now
  /*
  private async initializeDatabase(): Promise<void> {
    if (config.mongoUri) {
      try {
        await database.connect();
      } catch (error) {
        console.warn('⚠️  Database connection failed. Running without database.');
        console.warn('📝 Note: Some features may not work without database connection.');
      }
    } else {
      console.log('📦 No MongoDB URI provided, running without database');
    }
  }
  */

  private initializeMiddlewares(): void {
    // Security middleware
    this.app.use(
      helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        contentSecurityPolicy: false,
      })
    );

    // CORS middleware
    this.app.use(corsMiddleware);

    // Body parsing middleware
    this.app.use(
      express.json({
        limit: "50mb",
        verify: (req, _res, buf, encoding) => {
          if (buf && buf.length > 0) {
            try {
              JSON.parse(buf.toString());
            } catch (e) {
              console.error("Invalid JSON received:", buf.toString());
              const err: any = new Error("Invalid JSON");
              err.status = 400;
              throw err;
            }
          }
        },
      })
    );

    this.app.use(
      express.urlencoded({
        extended: true,
        limit: "50mb",
      })
    );

    // Request logging middleware (development only)
    if (config.nodeEnv === "development") {
      this.app.use((req, res, next) => {
        const timestamp = new Date().toISOString();
        console.log(`${timestamp} - ${req.method} ${req.path} - ${req.ip}`);

        // Only log body for POST/PUT requests
        if (["POST", "PUT", "PATCH"].includes(req.method)) {
          console.log("Body:", req.body);
        }

        next();
      });
    }

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        success: true,
        message: "Journee Docs Backend API",
        version: "1.0.0",
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
        status: "Running with mock data (no database)",
        endpoints: {
          health: "/api/health",
          auth: "/api/auth",
          documents: "/api/documents",
          upload: "/api/upload",
          users: "/api/users",
        },
      });
    });
  }

  private initializeRoutes(): void {
    // API routes
    this.app.use("/api", apiRoutes);
  }

  private initializeErrorHandling(): void {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  public listen(): void {
    const port = config.port;

    this.app.listen(port, () => {
      this.logServerInfo(port);
    });

    // Graceful shutdown
    process.on("SIGTERM", this.gracefulShutdown);
    process.on("SIGINT", this.gracefulShutdown);
  }

  private logServerInfo(port: string | number): void {
    console.log("\n🎉 Journee Docs Backend Started Successfully!\n");
    console.log("📊 Server Information:");
    console.log(`  Port: ${port}`);
    console.log(`  Environment: ${config.nodeEnv}`);
    console.log(`  Base URL: http://localhost:${port}`);
    console.log(`  Frontend URL: ${config.frontendUrl}`);
    console.log("  🔧 Running with MOCK DATA (no database)\n");

    console.log("🔗 API Endpoints:");
    console.log(`  🏥 Health Check: http://localhost:${port}/api/health`);
    console.log(`  🔐 Authentication: http://localhost:${port}/api/auth`);
    console.log(`  📄 Documents: http://localhost:${port}/api/documents`);
    console.log(`  📁 File Upload: http://localhost:${port}/api/upload`);
    console.log(`  👥 Users: http://localhost:${port}/api/users\n`);

    console.log("📝 Ready to handle requests!");
    console.log("Press Ctrl+C to stop the server\n");
  }

  private gracefulShutdown = async (signal: string): Promise<void> => {
    console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);

    try {
      // Comment out database disconnect for now
      // if (config.mongoUri) {
      //   await database.disconnect();
      // }
      console.log("✅ Server closed successfully");
      process.exit(0);
    } catch (error) {
      console.error("❌ Error during shutdown:", error);
      process.exit(1);
    }
  };
}

// Create and start the application
const app = new App();
app.listen();

export default app;
