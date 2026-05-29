import jwt from "jsonwebtoken";
import { UserRole } from "@prisma/client";
import { env } from "../config/env";

type JwtPayload = {
  sub: string;
  role: UserRole;
  email: string;
};

export function signToken(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: "8h" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
