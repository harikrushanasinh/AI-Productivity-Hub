export interface Bookmark {
  id: string;
  url: string;
  title: string;
  description: string | null;
  faviconUrl: string | null;
  folder: string;
  tags: string[] | null;
  isFavorite: boolean;
}
