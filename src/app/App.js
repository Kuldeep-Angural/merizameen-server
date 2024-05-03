import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import passport from "passport";
import session from "express-session";

import databaseConnector from "../config/databaseConnector.js";
import authController from "../controller/authController.js";
import postController from "../controller/postController.js";
import userController from "../controller/userController.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 8081;

// Middleware
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cors({ origin: process.env.CLIENT_URL||'*', methods: "GET,POST,PUT,DELETE", credentials: true }));
app.options("*", cors());
app.use(
  session({
    secret: "njsbkdbadwq7r923gfb348rt38",
    resave: false,
    saveUninitialized: true,
  })
);
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// Database connection
databaseConnector();

// Routes
app.get("/", (req, res) => res.send("Home Page"));
app.use("/api/auth", authController);
app.use("/api/user", userController);
app.use("/api/post", postController);
app.get("/api/", (req, res) => res.json({ message: `Server is running on port ${PORT}` }));

// Start server
app.listen(PORT, () => {
  console.log("Congratulations! Server started successfully on PORT:", PORT);
  console.log("Wait for loading all modules...");
  console.log("*** Meri-Zameen ***");
});
