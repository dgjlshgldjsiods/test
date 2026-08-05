import { initializeProtectedPage } from '../app.js';

await initializeProtectedPage({
  titleKey: 'pages.serviceCatalog',
  activeNav: 'catalog',
  contentKey: 'pages.stub'
});
