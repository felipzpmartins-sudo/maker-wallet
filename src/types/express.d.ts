import { UserRole } from "@prisma/client";

declare global {
  namespace Express {
    interface User {
      id: string;
      role: UserRole;
      email: string;
      allowedDepartments: string[];
      totalAccess: boolean;
      canManagePermissions: boolean;
    }

    interface Request {
      user?: User;
    }
  }
}
