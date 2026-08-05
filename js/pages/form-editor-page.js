import { initializeProtectedPage } from '../app.js';
import { PAGE_ROLES } from '../core/permissions.js';

await initializeProtectedPage({
  titleKey: 'pages.formEditor',
  activeNav: 'admin-forms',
  requiredRoles: PAGE_ROLES.formEditor,
  contentKey: 'pages.stub'
});
