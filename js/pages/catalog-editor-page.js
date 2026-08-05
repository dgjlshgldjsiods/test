import { initializeProtectedPage } from '../app.js';
import { PAGE_ROLES } from '../core/permissions.js';

await initializeProtectedPage({
  titleKey: 'pages.catalogEditor',
  activeNav: 'admin-catalog',
  requiredRoles: PAGE_ROLES.catalogEditor,
  contentKey: 'pages.stub'
});
