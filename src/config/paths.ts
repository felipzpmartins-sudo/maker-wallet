import path from "path";

export const uploadDirectory = path.resolve(process.cwd(), "uploads");
export const profilePhotoDirectory = path.join(uploadDirectory, "profile-photos");
