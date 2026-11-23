import { useState, useCallback, useRef, useEffect } from 'react';

export interface FileAttachment {
  file: File | null;
  previewUrl: string | null;
  name: string | null;
  type: string | null;
  size: number | null;
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function useFileAttachment({
  onFileSelect,
  onError,
  shouldRevoke,
}: {
  onFileSelect?: (file: File, previewUrl: string) => void;
  onError?: (message: string) => void;
  shouldRevoke?: (url: string) => boolean;
} = {}) {
  const [attachment, setAttachment] = useState<FileAttachment>({
    file: null,
    previewUrl: null,
    name: null,
    type: null,
    size: null,
  });
  const objectUrlsRef = useRef<Set<string>>(new Set());

  const clearAttachment = useCallback(() => {
    if (attachment.previewUrl) {
      const doRevoke = shouldRevoke ? shouldRevoke(attachment.previewUrl) : true;
      if (doRevoke) {
        URL.revokeObjectURL(attachment.previewUrl);
        objectUrlsRef.current.delete(attachment.previewUrl);
      }
    }
    setAttachment({
      file: null,
      previewUrl: null,
      name: null,
      type: null,
      size: null,
    });
  }, [attachment.previewUrl, shouldRevoke]);

  const handleFileSelect = useCallback((file: File) => {
    const isImage = ALLOWED_IMAGE_TYPES.includes(file.type);
    const isDoc = file.type === 'application/pdf' ||
                  file.name.toLowerCase().endsWith('.pdf') ||
                  file.name.toLowerCase().endsWith('.txt') ||
                  file.name.toLowerCase().endsWith('.md');

    if (!isImage && !isDoc) {
      onError?.('Unsupported file. Use JPG/PNG/WEBP/GIF or PDF/TXT/MD notes.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError?.(`File exceeds 10 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    // Clear previous preview if not retained
    if (attachment.previewUrl) {
      const doRevoke = shouldRevoke ? shouldRevoke(attachment.previewUrl) : true;
      if (doRevoke) {
        URL.revokeObjectURL(attachment.previewUrl);
        objectUrlsRef.current.delete(attachment.previewUrl);
      }
    }

    const objectUrl = URL.createObjectURL(file);
    objectUrlsRef.current.add(objectUrl);

    setAttachment({
      file,
      previewUrl: objectUrl,
      name: file.name,
      type: file.type,
      size: file.size,
    });

    onFileSelect?.(file, objectUrl);
  }, [attachment.previewUrl, onFileSelect, onError, shouldRevoke]);

  // Cleanup on unmount
  const urlsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    urlsRef.current = objectUrlsRef.current;
    return () => {
      urlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      urlsRef.current.clear();
    };
  }, []);

  return {
    attachment,
    setAttachment: handleFileSelect,
    clearAttachment,
    hasAttachment: attachment.file !== null,
  };
}