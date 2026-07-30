import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { routes } from "./routes";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import { getProfilePhoto } from "./controllers/uploadController";
import { profilePhotoDirectory } from "./config/paths";

export const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.get("/uploads/profile-photos/:userId", getProfilePhoto);
app.use("/uploads/profile-photos", express.static(profilePhotoDirectory));

app.use(routes);

app.use(errorMiddleware);
