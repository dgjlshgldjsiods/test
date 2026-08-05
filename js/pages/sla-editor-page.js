import { initializeProtectedPage } from '../app.js';
import { PAGE_ROLES } from '../core/permissions.js';

await initializeProtectedPage({
  titleKey: 'pages.slaEditor',
  activeNav: 'admin-sla',
  requiredRoles: PAGE_ROLES.slaEditor,
  contentKey: 'pages.stub'
});
