import type { FileTile } from '../store';

/** Uploads one file to this server's own disk (see server/src/index.js) and returns its
 * metadata — the actual FileTile that gets stored on the task once this resolves. */
export async function uploadFile(file: File): Promise<FileTile> {
  const body = new FormData();
  body.append('file', file);
  const res = await fetch('/api/files', { method: 'POST', body });
  if (!res.ok) {
    const message = await res.json().catch(() => null);
    throw new Error(message?.error ?? `Failed to upload ${file.name} (${res.status})`);
  }
  return res.json();
}

export function fileDownloadUrl(id: string): string {
  return `/api/files/${id}`;
}

export async function deleteUploadedFile(id: string): Promise<void> {
  const res = await fetch(fileDownloadUrl(id), { method: 'DELETE' });
  if (!res.ok) throw new Error(`Failed to delete file (${res.status})`);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let value = bytes / 1024;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`;
}

/** Which Phosphor icon represents a file, based on what the browser reported as its type. */
export function iconForMime(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'ph-image';
  if (mimeType.startsWith('video/')) return 'ph-file-video';
  if (mimeType.startsWith('audio/')) return 'ph-file-audio';
  if (mimeType === 'application/pdf') return 'ph-file-pdf';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'ph-file-zip';
  if (mimeType.startsWith('text/')) return 'ph-file-text';
  return 'ph-file';
}
