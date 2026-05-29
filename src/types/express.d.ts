import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
      email: string;
    }

    interface Request {
      user?: User;
    }
  }
}
