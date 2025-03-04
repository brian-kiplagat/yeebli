import { initializeFileUpload } from '$utils/fileUpload';
import { greetUser } from '$utils/greet';
import { RouteGuard } from '$utils/routeGuards';

window.Webflow ||= [];
window.Webflow.push(() => {
  const name = 'Yeebli';
  greetUser(name);

  // Get auth tokens from cookies
  const cookies = document.cookie.split(';');
  const authToken = cookies.find((cookie) => cookie.trim().startsWith('token='))?.split('=')[1];
  const user = cookies.find((cookie) => cookie.trim().startsWith('user='))?.split('=')[1];

  if (!authToken || !user) {
    console.error('No auth token or user found');
    return;
  }

  // Set auth token for both RouteGuard and FileUploader
  RouteGuard.setAuthToken(authToken);
  initializeFileUpload(authToken);
});
