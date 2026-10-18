import type { DropzoneOptions } from 'react-dropzone';
import type { Theme, SxProps } from '@mui/material/styles';
import type { FileThumbnailProps } from '../file-thumbnail';

// ----------------------------------------------------------------------

export type FileUploadType = File | string | null;
export type FilesUploadType = (File | string)[];
export type PreviewOrientation = 'horizontal' | 'vertical';

export type MultiFilePreviewProps = {
  files: FilesUploadType;
  startNode?: React.ReactNode;
  endNode?: React.ReactNode;
  orientation?: PreviewOrientation;
  thumbnail?: Omit<FileThumbnailProps, 'file'>;
  onRemove?: (file: File | string) => void;
  className?: string;
  sx?: SxProps<Theme>;
};

export type UploadProps = DropzoneOptions & {
  error?: boolean;
  loading?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
  hideFilesRejected?: boolean;
  helperText?: React.ReactNode;
  placeholder?: React.ReactNode;
  previewOrientation?: PreviewOrientation;
  value?: FileUploadType | FilesUploadType;
  onDelete?: () => void;
  onUpload?: () => void;
  onRemoveAll?: () => void;
  onRemove?: (file: File | string) => void;
  slotProps?: {
    wrapper?: Record<string, any>;
    multiPreview?: Partial<MultiFilePreviewProps>;
    rejectedFiles?: Record<string, any>;
  };
};
