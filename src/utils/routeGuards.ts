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
    { path: '/host/dashboard-host-view-leads', requireAuth: true },
    { path: '/host/dashboard-host-add-leads', requireAuth: true },
    { path: '/host/dashboard-host-add-event', requireAuth: true },
    { path: '/host/dashboard-host-view-events', requireAuth: true },
    { path: '/host/dashboard-host-view-assets', requireAuth: true },
    { path: '/host/dashboard-host-view-owner', requireAuth: true },
    { path: '/host/dashboard-host-billing', requireAuth: true },
    { path: '/host/dashboard-host-view-hosts', requireAuth: true },
    { path: '/host/dashboard-host', requireAuth: true },
    { path: '/profile', requireAuth: true },
    { path: '/settings', requireAuth: true, redirectPath: '/custom-login' },
    // Add more protected paths as needed
  ];

  private static authToken: string;

  /**
   * Sets the authentication token for route guards
   * @param token - The authentication token
   */
  static setAuthToken(token: string) {
    this.authToken = token;
  }

  private static async isAuthenticated(): Promise<boolean> {
    // Don't redirect if we're already on onboarding pages
    if (window.location.pathname.startsWith('/onboarding')) {
      return true;
    }

    if (!this.authToken) {
      window.location.href = '/onboarding/login?error=unauthorized';
      return false;
    }

    // Confirm authToken is actually valid by posting to server with bearer token
    const response = await fetch('https://api.3themind.com/v1/user/me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.authToken}`,
      },
    });

    if (!response.ok) {
      window.location.href = '/onboarding/login?error=unauthorized';
      return false;
    }

    const data = await response.json();
    const userObject = data.data.user;

    localStorage.setItem('user', JSON.stringify(userObject));

    return true;
  }

  private static getCurrentPath(): string {
    return window.location.pathname;
  }

  private static matchPath(protectedPath: string, currentPath: string): boolean {
    // Simple path matching - you can make this more sophisticated
    return currentPath.startsWith(protectedPath);
  }

  static async checkAccess(options: RouteGuardOptions = {}): Promise<boolean> {
    const currentPath = this.getCurrentPath();
    const matchedRoute = this.protectedPaths.find((route) =>
      this.matchPath(route.path, currentPath)
    );

    if (!matchedRoute) {
      return true; // Path is not protected
    }

    const {
      redirectPath = options.redirectPath || '/onboarding/login?error=unauthorized',
      requireAuth = options.requireAuth ?? true,
    } = matchedRoute;

    if (requireAuth) {
      const authenticated = await this.isAuthenticated();
      console.log('authenticated', authenticated);
      if (!authenticated) {
        console.error('not authenticated, kicking out');
        window.location.href = redirectPath;
        return false;
      }
    }

    return true;
  }
}

// Update the protectRoute function to handle async
export const protectRoute = async (options?: RouteGuardOptions) => {
  return await RouteGuard.checkAccess(options);
};
