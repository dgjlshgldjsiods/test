import { initializeProtectedPage } from '../app.js';

await initializeProtectedPage({
  titleKey: 'pages.profile',
  activeNav: 'profile',
  contentKey: 'pages.stub'
});
