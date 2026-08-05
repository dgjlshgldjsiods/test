import { initializeProtectedPage } from '../app.js';

await initializeProtectedPage({
  titleKey: 'pages.serviceForm',
  activeNav: 'catalog',
  contentKey: 'pages.stub'
});
