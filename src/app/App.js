import bodyParser from "body-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import passport from "passport";

import databaseConnector from "../config/databaseConnector.js";
import { serverTest } from "../constants/serverTesting.js";
import authController from "../controller/authController.js";
import postController from "../controller/postController.js";
import userController from "../controller/userController.js";
import { authentication, checkRoles } from "../middelware/authenticate.js";
import { DefineJobs } from "./DefineJobs.js";
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8081;




// Middleware
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(cors({ origin: process.env.CLIENT_URL||'*', methods: "GET,POST,PUT,DELETE", credentials: true }));
app.options("*", cors());
app.use( session({secret: "njsbkdbadwq7r923gfb348rt38",resave: false,saveUninitialized: true,}));
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

databaseConnector();

//cronjobs starts
DefineJobs();

// Routes
app.get("/health", (req, res) => res.send(serverTest));
app.use("/api/auth", authController);
app.use("/api/user", userController);
app.use("/api/post",authentication,checkRoles(), postController);

app.listen(PORT, () => {
  console.log("Congratulations! Server started successfully on PORT:", PORT);
  console.log("Wait for loading all modules...");
  console.log("*** Meri-Zameen ***");
});
