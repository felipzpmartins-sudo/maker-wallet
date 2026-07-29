import fs from "fs";
import { app } from "./app";
import { env } from "./config/env";
import { profilePhotoDirectory, uploadDirectory } from "./config/paths";

fs.mkdirSync(uploadDirectory, { recursive: true });
fs.mkdirSync(profilePhotoDirectory, { recursive: true });

app.listen(env.PORT, () => {
  console.log(`Maker Wallet API running on port ${env.PORT}`);
});
