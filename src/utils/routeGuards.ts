export class RouteGuard {
  private static protectedPaths: Array<{
    path: string;
    requireSubscription: boolean; // Not optional
  }> = [
    { path: '/host/dashboard-host-view-leads', requireSubscription: true },
    { path: '/host/dashboard-host-add-leads', requireSubscription: true },
    { path: '/host/dashboard-host-add-event', requireSubscription: true },
    { path: '/host/dashboard-host-view-events', requireSubscription: true },
    { path: '/host/dashboard-host-view-assets', requireSubscription: true },
    { path: '/host/dashboard-host-view-owner', requireSubscription: true },
    { path: '/host/dashboard-host-billing', requireSubscription: false },
    { path: '/host/dashboard-host-view-hosts', requireSubscription: true },
    { path: '/host/dashboard-host', requireSubscription: true },
    { path: '/profile', requireSubscription: false },
    { path: '/settings', requireSubscription: false },
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

  private static hasValidSubscription(): boolean {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return ['active', 'trialing'].includes(user.subscription_status);
  }

  static async checkAccess(): Promise<boolean> {
    try {
      const currentPath = window.location.pathname;

      // Skip checks if we're on onboarding pages
      if (currentPath.startsWith('/onboarding')) {
        return true;
      }

      // Check if any protected path is a prefix of the current path
      const matchedPath = this.protectedPaths.find((route) => {
        const currentSegments = currentPath.split('/').filter(Boolean);
        const protectedSegments = route.path.split('/').filter(Boolean);
        return protectedSegments.every((segment, index) => currentSegments[index] === segment);
      });

      // If path is not in our protected paths array, allow access
      if (!matchedPath) {
        return true;
      }

      // First check authentication
      const authenticated = await this.isAuthenticated();
      if (!authenticated) {
        window.location.href = '/onboarding/login';
        return false;
      }

      // Then check subscription level if required
      if (matchedPath.requireSubscription && !this.hasValidSubscription()) {
        window.location.href = '/onboarding/onboardpricing?error=subscription';
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
