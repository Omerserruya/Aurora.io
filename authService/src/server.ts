// Omer-Serruya-322570243-Ron-Elmalech-322766809
import dotenv from "dotenv"
dotenv.config({ path: `.env.${process.env.NODE_ENV}` });

import bodyParser from "body-parser";
import express, { Express } from "express";
import authRoute from "./routes/auth_route";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUI from "swagger-ui-express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import passport from '../passport-config';  // Keep passport for initialization


const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Web Dev 2025 REST API",
      version: "1.0.0",
      description: "REST server including authentication using JWT",
    },
    servers: [{ url: `${process.env.ENV_URL}/auth` }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "accessToken",
          description: "Authentication uses HTTP cookies. No need to manually enter anything here - just login through the /auth/login endpoint."
        }
      },
    }
  },
  apis: ["./src/routes/*.ts"],
};
const specs = swaggerJsDoc(options);


const app = express();
const corsOptions = {
  origin: process.env.ENV_URL || '*',  // Allow dev origins if ENV_URL is not set
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));

const jwtSecret = process.env.JWT_KEY;
if (!jwtSecret) {
  throw new Error("JWT_SECRET is not defined in the environment variables");
}

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

// Routes Use
app.use('/', authRoute);
app.use("/api-docs", swaggerUI.serve, swaggerUI.setup(specs));

const initApp = () => {
  return new Promise<Express>((resolve, reject) => {
    console.log("Auth service initialized");
    resolve(app);
  });
};

export default initApp;