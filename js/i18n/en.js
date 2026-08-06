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
  },
  serviceForm: {
    missingService: 'Service identifier is missing.', unavailable: 'The service was not found or is unavailable.',
    formNotConfigured: 'No form is configured for this service.', formUnavailable: 'The published form version is unavailable.',
    unsafeSchema: 'The form schema contains unsupported or unsafe elements.',
    loadError: 'Could not load the service form.', form: 'Request form', submit: 'Submit request',
    submitting: 'Submitting…', validationError: 'Complete required fields and correct the errors.',
    serverValidationError: 'The server rejected the form values. Check the entered data.',
    submitError: 'Could not create the request.', attachments: 'Attachments', chooseFiles: 'Choose files',
    attachmentsUnavailable: 'The Naumen file adapter has not been confirmed. Attachments are temporarily unavailable.'
  },
  requests: {
    apply: 'Apply', moreFilters: 'More filters', empty: 'No requests match the selected filters.',
    loadError: 'Could not load the request list.',
    filters: {
      search: 'Search', number: 'Number', status: 'Status', any: 'Any value', title: 'Title',
      service: 'Service', author: 'Author', requestedFor: 'Requested for', group: 'Work group',
      assignee: 'Assignee', createdFrom: 'Created from', createdTo: 'Created to',
      slaBreached: 'SLA breach', reactionFrom: 'Reaction from', reactionTo: 'Reaction to',
      resolutionFrom: 'Resolution from', resolutionTo: 'Resolution to'
    },
    filterValue: { true: 'Breached', false: 'Not breached' },
    columns: {
      number: 'Number', title: 'Title', service: 'Service', author: 'Author', status: 'Status',
      group: 'Work group', assignee: 'Assignee', reaction: 'Reaction deadline',
      resolution: 'Resolution deadline', sla: 'SLA', createdAt: 'Created'
    },
    status: {
      NEW: 'New', REGISTERED: 'Registered', IN_PROGRESS: 'In progress', WAITING_USER: 'Waiting for user',
      RESOLVED: 'Resolved', CLOSED: 'Closed', CANCELLED: 'Cancelled', UNKNOWN: 'Unknown'
    },
    sla: { paused: 'Paused', breached: 'Breached', onTime: 'On time' }
  },
  requestCard: {
    missingId: 'Request identifier is missing.', loadError: 'Could not load request details.',
    service: 'Service', author: 'Author', requestedFor: 'Requested for', createdAt: 'Created',
    group: 'Work group', assignee: 'Assignee', submittedForm: 'Submitted form',
    changeStatus: 'Change status', statusComment: 'Status change comment',
    assignment: 'Assignment', notAssigned: 'Not assigned', assignmentError: 'Could not change assignment.',
    assignmentLoadError: 'Could not load assignment directories.', commandError: 'The operation failed.',
    versionConflict: 'Another user has changed the request. Reload the details.',
    comments: 'Comments', commentText: 'Comment text', commentType: 'Comment type',
    publicComment: 'Public', internalComment: 'Internal', addComment: 'Add comment',
    noComments: 'There are no comments yet.', commentError: 'Could not add the comment.', commentsLoadError: 'Could not load comments.',
    commentTypes: { PUBLIC: 'Public', INTERNAL: 'Internal' },
    history: 'History', noHistory: 'History is empty.', historyLoadError: 'Could not load history.',
    events: {
      CREATED: 'Request created', STATUS_CHANGED: 'Status changed', ASSIGNMENT_CHANGED: 'Assignment changed',
      FIELDS_CHANGED: 'Fields changed', COMMENT_ADDED: 'Comment added', ATTACHMENT_ADDED: 'Attachment added',
      SLA_CALCULATED: 'SLA calculated', SLA_PAUSED: 'SLA paused', SLA_RESUMED: 'SLA resumed',
      SLA_RULE_CONFLICT: 'SLA rule conflict', UNKNOWN: 'Request changed'
    },
    sla: 'SLA', reactionDeadline: 'Reaction deadline', resolutionDeadline: 'Resolution deadline',
    remainingReaction: 'Reaction time left', remainingResolution: 'Resolution time left', minutes: '{count} min',
    attachments: 'Attachments', noAttachments: 'No attachments.',
    attachmentReadOnly: 'Adding attachments will be implemented after the Naumen file adapter is confirmed.'
  },
  slaEditor: {
    serviceId: 'Service identifier (optional)', create: 'Create rule', edit: 'Edit rule',
    title: 'Title', order: 'Order', times: 'Reaction / resolution', enabled: 'Enabled', actions: 'Actions',
    enable: 'Enable', disable: 'Disable', delete: 'Delete', deleteConfirm: 'Delete the SLA rule?',
    reaction: 'Reaction, working minutes', resolution: 'Resolution, working minutes', calendar: 'Working calendar',
    conditions: 'Conditions', addCondition: 'Add condition', paused: 'Paused statuses',
    test: 'Context test', runTest: 'Test on server', checkConflicts: 'Check overlaps',
    serverResult: 'Server result', preview: 'Browser preview',
    approximateWarning: 'Warning: overlap detection is approximate', noWarnings: 'No potential conflicts found.',
    empty: 'No SLA rules found.', loadError: 'Could not load SLA rules.', saved: 'SLA changes saved.',
    commandError: 'The SLA operation failed.', versionConflict: 'Another user changed the rules. Reload the list.'
  },
  profile: {
    missingUser: 'Could not determine the user.', loadError: 'Could not load the profile.',
    login: 'Login', fullName: 'Full name', email: 'Email', phone: 'Phone',
    organizations: 'Organizations', department: 'Department', groups: 'Work groups', roles: 'Roles',
    language: 'Language', timezone: 'Time zone', active: 'Active', preferences: 'Profile preferences',
    adminEdit: 'Edit user', createdRequests: 'My requests', assignedRequests: 'Assigned directly to me',
    groupRequests: 'Assigned to my groups', noRequests: 'No requests.', requestsLoadError: 'Could not load requests.',
    saveError: 'Could not save the profile.', versionConflict: 'Another administrator has changed the profile. Reload the page.',
    roleNames: {
      USER: 'User', OPERATOR: 'Operator', CATALOG_ADMIN: 'Catalog administrator',
      FORM_ADMIN: 'Forms administrator', SLA_ADMIN: 'SLA administrator', SYSTEM_ADMIN: 'System administrator'
    }
  }
});
