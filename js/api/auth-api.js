export class AuthApi {
  constructor(apiClient) {
    this.apiClient = apiClient;
  }

  login(login, password) {
    return this.apiClient.exec('authLogin', { login, password }, { auth: false });
  }

  logout() {
    return this.apiClient.exec('authLogout');
  }

  refresh() {
    return this.apiClient.exec('authRefresh');
  }

  getCurrentUser() {
    return this.apiClient.exec('authGetCurrentUser');
  }
}
