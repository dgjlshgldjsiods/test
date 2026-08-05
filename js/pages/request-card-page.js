import { initializeProtectedPage } from '../app.js';

await initializeProtectedPage({
  titleKey: 'pages.requestCard',
  activeNav: 'requests',
  contentKey: 'pages.stub'
});
