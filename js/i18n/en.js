export const en = Object.freeze({
  common: {
    appName: 'ITSM', prototype: 'Prototype', user: 'User',
    logout: 'Sign out', cancel: 'Cancel', continue: 'Continue', close: 'Close',
    search: 'Search', retry: 'Retry', edit: 'Edit', save: 'Save', yes: 'Yes', no: 'No',
    skipToContent: 'Skip to content', language: 'Language', theme: 'Theme',
    lightTheme: 'Light', darkTheme: 'Dark', stageCaption: 'Basic interface structure'
  },
  nav: {
    main: 'Main navigation', catalog: 'Service catalog', requests: 'Requests',
    profile: 'Profile', catalogEditor: 'Catalog editor', forms: 'Forms', sla: 'SLA'
  },
  states: {
    loadingTitle: 'Loading', loading: 'Loading…', sessionLoading: 'Checking the user session…',
    emptyTitle: 'No data', empty: 'There is nothing here yet.',
    errorTitle: 'An error occurred', error: 'Could not load data.',
    sessionError: 'Could not verify the user session. Try again later.',
    forbiddenTitle: 'Access denied', forbidden: 'You do not have access to this section.'
  },
  login: {
    title: 'Sign in to ITSM', subtitle: 'Enter your user credentials.',
    login: 'Login', password: 'Password', submit: 'Sign in', pending: 'Signing in…',
    loginRequired: 'Enter your login.', passwordRequired: 'Enter your password.',
    invalidCredentials: 'Incorrect login or password.', error: 'Could not sign in. Try again later.'
  },
  pages: {
    stub: 'Business features for this page will be implemented in a separate stage.',
    login: 'Sign in', serviceCatalog: 'Service catalog', serviceForm: 'Create request',
    requests: 'Requests', requestCard: 'Request details', profile: 'Profile',
    catalogEditor: 'Catalog editor', forms: 'Forms', formEditor: 'Form editor', slaEditor: 'SLA settings'
  },
  pagination: {
    label: 'Page navigation', previous: 'Previous', next: 'Next', total: 'Total: {total}'
  },
  forms: {
    search: 'Search forms', searchPlaceholder: 'Title or code', statusFilter: 'Form status',
    allStatuses: 'All statuses', create: 'Create form', history: 'Version history',
    empty: 'No forms match the selected filters.', loadError: 'Could not load the forms list.',
    notPublished: 'Not published',
    columns: {
      code: 'Code', title: 'Title', status: 'Status', publishedVersion: 'Published version',
      draft: 'Draft', updatedAt: 'Updated', actions: 'Actions'
    },
    status: { DRAFT: 'Draft', PUBLISHED: 'Published', ARCHIVED: 'Archived', UNKNOWN: 'Unknown' }
  },
  formEditor: {
    code: 'Code', titleRu: 'Title (RU)', titleEn: 'Title (EN)', creator: 'Form designer',
    create: 'Create', save: 'Save draft', saved: 'Draft saved', publish: 'Publish',
    publishConfirm: 'Once published, this version cannot be edited. Continue?',
    historyTitle: 'Version history', backToEditor: 'Back to editor', viewVersion: 'View',
    createDraft: 'Create draft from version', openDraft: 'Open active draft',
    readOnly: 'This version is read-only. Create a new draft to make changes.',
    readOnlyWithDraft: 'This version is read-only. The form already has an active draft.',
    version: 'Version {number}', versionStatus: 'v{number} · {status}', noVersions: 'No versions yet.',
    activeDraftExists: 'This form already has an active draft.', versionConflict: 'Another user has changed this version. Reload the page.',
    commandError: 'The operation failed.', loadError: 'Could not load the form.',
    missingFormId: 'Form identifier is missing.', metadataRequired: 'Enter the code and Russian form title.',
    creatorUnavailable: 'SurveyJS Creator failed to load. Check CDN access.'
  },
  catalogEditor: {
    tree: 'Catalog tree', newRootFolder: 'New folder', newSubfolder: 'Create subfolder',
    newService: 'Create service', createFolder: 'Create folder', editFolder: 'Edit folder',
    createService: 'Create service', editService: 'Edit service', deleteFolder: 'Delete folder',
    deleteConfirm: 'Delete the empty folder?', folderNotEmpty: 'Only an empty folder can be deleted.',
    empty: 'The catalog is empty.', chooseItem: 'Select a tree item or create one.',
    loadError: 'Could not load the catalog tree.', itemLoadError: 'Could not load the catalog item.',
    commandError: 'Could not save changes.', versionConflict: 'Another user has changed this object. Reload the tree.',
    titleRu: 'Title (RU)', titleEn: 'Title (EN)', shortRu: 'Short description (RU)', shortEn: 'Short description (EN)',
    descriptionRu: 'Description (RU)', descriptionEn: 'Description (EN)', icon: 'Icon code',
    code: 'Code', sortOrder: 'Display order', status: 'Status', form: 'Form', formVersion: 'Published form version',
    group: 'Work group', assignee: 'Assignee', sla: 'SLA policy', availability: 'Availability',
    users: 'Users', departments: 'Departments', organizations: 'Organizations', notSelected: 'Not selected',
    move: 'Move service', saveBeforeMove: 'Save or discard the current changes before moving the service.',
    finishEditing: 'Save or cancel the current changes first.'
  },
  serviceCatalog: {
    loadError: 'Could not load available services.', searchPlaceholder: 'Search the catalog',
    viewMode: 'View mode', cards: 'Cards', list: 'List', folders: 'Catalog folders',
    allServices: 'All services', breadcrumbs: 'Breadcrumbs', root: 'Catalog',
    empty: 'This folder has no available services.', searchEmpty: 'No services match your search.'
  }
});
