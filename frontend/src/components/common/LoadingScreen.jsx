import SplashScreen from './SplashScreen';

const LoadingScreen = ({ message = 'Loading...', variant = 'page' }) => (
  <SplashScreen variant={variant} message={message} />
);

export default LoadingScreen;
