export const en = Object.freeze({
  common: {
    appName: 'ITSM', prototype: 'Prototype', user: 'User',
    logout: 'Sign out', cancel: 'Cancel', continue: 'Continue', close: 'Close',
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
  }
});
