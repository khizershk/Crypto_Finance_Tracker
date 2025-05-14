import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectToDatabase } from "./db";
import { storage, initializeStorage } from "./storage";
import dotenv from 'dotenv';
dotenv.config();


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  try {
    try {
      console.log("Initializing MongoDB database...");
      const connected = await connectToDatabase();
      if (connected) {
        console.log("MongoDB connection successful");
      } else {
        throw new Error("MongoDB connection failed");
      }
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
      process.exit(1); // exit the app if DB fails
    }
    
    // Initialize storage system
    // Priority: Persistent Memory > MongoDB > PostgreSQL
    // We're using persistent memory storage as our primary storage solution
    // (works like a NoSQL database by persisting data to disk with automatic backups)
    const storageType = 'persistent-memory';
    await initializeStorage(storageType);
    
    console.log("*********************************************");
    console.log("* Using persistent file storage as main database *");
    console.log("* Data will be automatically saved to disk      *");
    console.log("* and loaded on application restart             *");
    console.log("*********************************************");

    // Ensure default user exists in storage
    try {
      // Create default user if it doesn't exist
      const defaultUser = await storage.getUserByUsername('user1');
      if (!defaultUser) {
        await storage.createUser({
          username: 'user1',
          password: 'password123'
        });
        console.log("Default user created in persistent storage");
      } else {
        console.log("Default user found in persistent storage");
      }
    } catch (error) {
      console.error("Error creating default data:", error);
    }
    
    const server = await registerRoutes(app);

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      res.status(status).json({ message });
      throw err;
    });

    // importantly only setup vite in development and after
    // setting up all the other routes so the catch-all route
    // doesn't interfere with the other routes
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // ALWAYS serve the app on port 5000
    // this serves both the API and the client.
    // It is the only port that is not firewalled.
    const port = 5000;
    server.listen({
      port,
      host: "0.0.0.0",
      reusePort: true,
    }, () => {
      log(`serving on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to initialize application:", error);
  }
})();
