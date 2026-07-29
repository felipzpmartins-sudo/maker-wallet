import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env";
import { routes } from "./routes";
import { errorMiddleware } from "./middlewares/errorMiddleware";
import { profilePhotoDirectory } from "./config/paths";

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true
  })
);
app.use(express.json({ limit: "1mb" }));
app.use("/uploads/profile-photos", express.static(profilePhotoDirectory));

app.use(routes);

app.use(errorMiddleware);
