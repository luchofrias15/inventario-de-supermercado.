export interface BaseRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection<T extends BaseRecord = BaseRecord> {
  _meta: { version: number; lastModified: string; description: string };
  records: T[];
}

export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
