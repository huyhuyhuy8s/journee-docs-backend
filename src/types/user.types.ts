export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  color: string;
}

export interface SearchUsersQuery {
  q: string;
  limit?: number;
}

export interface UserSearchResult {
  users: UserProfile[];
  totalCount: number;
}