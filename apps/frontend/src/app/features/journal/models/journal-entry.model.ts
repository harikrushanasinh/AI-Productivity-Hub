export interface JournalEntry {
  id: string;
  entryDate: string;
  title: string | null;
  content: string;
  mood: 1 | 2 | 3 | 4 | 5 | null;
  tags: string[] | null;
  isPrivate: boolean;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}
