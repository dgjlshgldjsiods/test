export class UsersApi {
  constructor(apiClient) { this.apiClient = apiClient; }
  get(userId = null) { return this.apiClient.exec('usersGet', userId ? { userId } : {}); }
  update(userId, changes, expectedVersion) {
    return this.apiClient.exec('usersUpdate', { userId, changes, expectedVersion });
  }
}
