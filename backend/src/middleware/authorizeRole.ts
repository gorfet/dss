import type { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    roles: string[];
    departmentId?: string;
  };
}

export const authorizeRole = (allowedRoles: string[]) => {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const user = request.user;
    if (!user) {
      return response.status(401).json({ message: 'Authentication required.' });
    }

    const hasRole = user.roles.some((role) => allowedRoles.includes(role));
    if (!hasRole) {
      return response.status(403).json({ message: 'Access denied.' });
    }

    return next();
  };
};

export const enforceDepartmentScope = (requestingDepartmentId?: string) => {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const user = request.user;
    if (!user) {
      return response.status(401).json({ message: 'Authentication required.' });
    }

    if (requestingDepartmentId && user.departmentId !== requestingDepartmentId) {
      return response.status(403).json({ message: 'Department scope violation.' });
    }

    return next();
  };
};
