import { greetUser } from '$utils/greet';
import { RouteGuard } from '$utils/routeGuards';
window.Webflow ||= [];
window.Webflow.push(() => {
  const name = 'Brian Test Kiplagat';
  greetUser(name);
  RouteGuard.checkAccess();
});
