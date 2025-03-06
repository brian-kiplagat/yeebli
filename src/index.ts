import { initializeFileUpload } from '$utils/fileUpload';
import { greetUser } from '$utils/greet';
import { RouteGuard } from '$utils/routeGuards';
import { Video } from '$utils/video';

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
  //if pathname is /host/dashboard-host-view-assets, then initialize the file upload
  if (window.location.pathname === '/host/dashboard-host-view-assets') {
    initializeFileUpload(authToken);
  }
  //if pathname is /eventPage, then init the player
  if (window.location.pathname === '/eventpage') {
    addToHead();
    const video = document.querySelector('[wized="video_player"]');
    if (!video) {
      console.error('No video found');
      return;
    }
    initializePlayer(video as HTMLElement);
  }
});

const addToHead = () => {
  /**Attach Plyr css to head */
  const plyrCss = document.createElement('link');
  plyrCss.href = 'https://cdn.plyr.io/3.7.8/plyr.css';
  plyrCss.rel = 'stylesheet';
  document.head.appendChild(plyrCss);
  /**Attach Plyr js to head */
};

const initializePlayer = (video: HTMLElement) => {
  console.log(video);
  const player = new Video(
    'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4',
    video
  );
  console.log(player);
};
