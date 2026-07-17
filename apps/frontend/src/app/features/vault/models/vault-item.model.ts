export type VaultItemCategory = 'login' | 'card' | 'note' | 'other';

export interface VaultItemSummary {
  id: string;
  title: string;
  username: string | null;
  url: string | null;
  category: VaultItemCategory;
  isFavorite: boolean;
  hasNotes: boolean;
}

export interface RevealedSecret {
  password: string;
  notes: string | null;
}
