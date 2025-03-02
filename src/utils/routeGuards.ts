interface RouteGuardOptions {
  redirectPath?: string;
  requireAuth?: boolean;
}

interface ProtectedRoute {
  path: string;
  requireAuth?: boolean;
  redirectPath?: string;
}

export class RouteGuard {
  private static protectedPaths: ProtectedRoute[] = [
    { path: '/dashboard', requireAuth: true },
    { path: '/profile', requireAuth: true },
    { path: '/settings', requireAuth: true, redirectPath: '/custom-login' },
    // Add more protected paths as needed
  ];

  private static isAuthenticated(): boolean {
    // Get authToken from cookies
    const cookies = document.cookie.split('; ');
    const authToken = cookies.find((cookie) => cookie.startsWith('authToken='))?.split('=')[1];
    const user = cookies.find((cookie) => cookie.startsWith('user='))?.split('=')[1];
    console.log(authToken, user);
    return !!authToken && !!user;
  }

  private static getCurrentPath(): string {
    return window.location.pathname;
  }

  private static matchPath(protectedPath: string, currentPath: string): boolean {
    // Simple path matching - you can make this more sophisticated
    return currentPath.startsWith(protectedPath);
  }

  static checkAccess(options: RouteGuardOptions = {}): boolean {
    const currentPath = this.getCurrentPath();
    const matchedRoute = this.protectedPaths.find((route) =>
      this.matchPath(route.path, currentPath)
    );

    if (!matchedRoute) {
      return true; // Path is not protected
    }

    const {
      redirectPath = options.redirectPath || '/login',
      requireAuth = options.requireAuth ?? true,
    } = matchedRoute;

    if (requireAuth && !this.isAuthenticated()) {
      window.location.href = redirectPath;
      return false;
    }

    return true;
  }
}

// Usage example:
export const protectRoute = (options?: RouteGuardOptions) => {
  return RouteGuard.checkAccess(options);
};
