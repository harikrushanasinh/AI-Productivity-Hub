export interface FileItem {
  id: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  folderPath: string;
  createdAt: string;
}

export interface StorageStats {
  usedBytes: number;
  quotaBytes: number;
  percentUsed: number;
}
