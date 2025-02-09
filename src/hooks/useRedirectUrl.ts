import { useLocation } from 'react-router-dom';

export function useRedirectUrl() {
  const location = useLocation();
  const defaultRedirect = '/dashboard';

  // Get redirect URL from location state or search params
  const redirectUrl = 
    (location.state as { from?: Location })?.from?.pathname ||
    new URLSearchParams(location.search).get('redirect') ||
    defaultRedirect;

  // Ensure redirect URL is safe (internal)
  const isSafeUrl = redirectUrl.startsWith('/') && !redirectUrl.startsWith('//');
  return isSafeUrl ? redirectUrl : defaultRedirect;
}