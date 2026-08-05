import { initializeProtectedPage } from '../app.js';

await initializeProtectedPage({
  titleKey: 'pages.requests',
  activeNav: 'requests',
  contentKey: 'pages.stub'
});
