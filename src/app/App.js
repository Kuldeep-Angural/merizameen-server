import bodyParser from "body-parser";
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import databaseConnector from "../config/databaseConnector.js";
import cors from 'cors';
import authController  from '../controller/authController.js'
import postController from '../controller/postController.js';


const app = express();
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));
app.use(express.json());
const PORT = process.env.PORT || 8081;databaseConnector();
app.use(cors({ origin:process.env.CLIENT_URL,methods:"GET,POST,PUT,DELETE",credentials:true}));

app.get('/api/',(req,res)=>{res.json({message:`server is running on port${process.env.PORT} `})})
app.use('/api/auth',authController);
app.use('/api/user',postController);
app.listen(PORT, () => {
  console.log("Congratulations Server started Successfully on PORT:", PORT);
  console.log("Wait for Loading all Module");
  console.log(" *** Meri-Zameen ***");
});

app.get("/", (req, res) => {
  res.json("Hello Dev!");
});
