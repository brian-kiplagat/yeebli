export class RouteGuard {
  private static protectedPaths: string[] = [
    '/host/dashboard-host-view-leads',
    '/host/dashboard-host-add-leads',
    '/host/dashboard-host-add-event',
    '/host/dashboard-host-view-events',
    '/host/dashboard-host-view-assets',
    '/host/dashboard-host-view-owner',
    '/host/dashboard-host-billing',
    '/host/dashboard-host-view-hosts',
    '/host/dashboard-host',
    '/profile',
    '/settings',
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
    try {
      const response = await fetch('https://api.3themind.com/v1/user/me', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      localStorage.setItem('user', JSON.stringify(data.data.user));
      return true;
    } catch (error) {
      console.error('Authentication check failed:', error);
      return false;
    }
  }

  static async checkAccess(): Promise<boolean> {
    try {
      const currentPath = window.location.pathname;

      // Skip checks if we're on onboarding/login pages
      if (currentPath.startsWith('/onboarding')) {
        return true;
      }

      // Check if any protected path is a prefix of the current path
      const isProtectedPath = this.protectedPaths.some((protectedPath) => {
        // Split paths into segments and compare
        const currentSegments = currentPath.split('/').filter(Boolean);
        const protectedSegments = protectedPath.split('/').filter(Boolean);

        // Check if the protected path segments match the start of current path
        return protectedSegments.every((segment, index) => currentSegments[index] === segment);
      });

      // If path is not in our protected paths array, allow access
      if (!isProtectedPath) {
        return true;
      }

      const authenticated = await this.isAuthenticated();

      if (!authenticated) {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Route guard check failed:', error);
      return false;
    }
  }
}

// Update the protectRoute function to handle async
export const protectRoute = async (): Promise<boolean> => {
  return await RouteGuard.checkAccess();
};
