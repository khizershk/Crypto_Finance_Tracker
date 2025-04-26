import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { connectToDatabase, connectToPgDatabase } from "./db";
import { storage, initializeStorage } from "./storage";
import { initializeDatabase } from "./initDb";

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
    // Attempt to connect to databases 
    let connectedToMongo = false;
    let connectedToPg = false;
    
    // We'll prioritize MongoDB connection below
    // (This section intentionally left empty to avoid duplicate connection attempts)
    
    // First priority is MongoDB (as requested by user)
    try {
      console.log("Initializing MongoDB database...");
      connectedToMongo = await connectToDatabase();
      if (connectedToMongo) {
        console.log("MongoDB connection successful");
      }
    } catch (error) {
      console.error("Error connecting to MongoDB:", error);
    }
    
    // Only try PostgreSQL if MongoDB fails
    if (!connectedToMongo) {
      try {
        console.log("Falling back to PostgreSQL...");
        connectedToPg = await connectToPgDatabase();
        if (connectedToPg) {
          console.log("PostgreSQL connection successful");
        }
      } catch (error) {
        console.error("Error connecting to PostgreSQL:", error);
      }
    }
    
    // Initialize storage system
    // Priority: MongoDB > PostgreSQL > persistent-memory
    const storageType = connectedToMongo ? 'mongodb' : (connectedToPg ? 'postgres' : 'persistent-memory');
    await initializeStorage(storageType);
    
    if (connectedToMongo && !connectedToPg) {
      try {
        console.log("Initializing MongoDB data...");
        // Create default user if it doesn't exist
        const { User } = require('./models');
        const defaultUser = await User.findOne({ username: 'user1' });
        if (!defaultUser) {
          console.log("Creating default user...");
          const newUser = new User({
            username: 'user1',
            password: 'password123'
          });
          await newUser.save();
          console.log("Default user created successfully");
        }
      } catch (error) {
        console.error("Error initializing MongoDB data:", error);
      }
    } else if (!connectedToPg && !connectedToMongo) {
      console.log("Using in-memory storage as fallback");
      
      // Create default data in memory storage
      try {
        // Create default user
        const defaultUser = await storage.getUserByUsername('user1');
        if (!defaultUser) {
          await storage.createUser({
            username: 'user1',
            password: 'password123'
          });
          console.log("Default user created in memory storage");
        }
      } catch (error) {
        console.error("Error creating default data in memory storage:", error);
      }
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
