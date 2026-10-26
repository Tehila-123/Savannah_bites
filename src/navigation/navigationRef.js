import { createNavigationContainerRef } from '@react-navigation/native';

// Kept in its own module so the auth context can navigate without importing
// the navigator that renders it.
export const navigationRef = createNavigationContainerRef();
