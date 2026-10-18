import type { UploadProps } from '../types';

import { useDropzone } from 'react-dropzone';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import CircularProgress from '@mui/material/CircularProgress';

import { UploadIllustration } from '../../illustrations';
import { Iconify } from '../../iconify';
import { uploadClasses } from '../classes';
import { RejectedFiles } from '../components/rejected-files';
import { MultiFilePreview } from '../components/multi-file-preview';
import { SingleFilePreview } from '../components/single-file-preview';
import { UploadArea, DeleteButton, UploadWrapper, PlaceholderContainer } from './styles';

// ----------------------------------------------------------------------

export function Upload({
  sx,
  value,
  error,
  disabled,
  onDelete,
  onUpload,
  onRemove,
  className,
  helperText,
  onRemoveAll,
  slotProps,
  loading = false,
  multiple = false,
  hideFilesRejected = false,
  previewOrientation = 'horizontal',
  ...dropzoneOptions
}: UploadProps) {
  const { getRootProps, getInputProps, isDragActive, isDragReject, fileRejections } = useDropzone({
    multiple,
    disabled,
    ...dropzoneOptions,
  });

  const isSingleFileSelected = !multiple && !!value && !Array.isArray(value);
  const hasMultiFilesSelected = multiple && Array.isArray(value) && value.length > 0;
  const hasError = isDragReject || !!error;
  const showFilesRejected = !hideFilesRejected && fileRejections.length > 0;

  const renderPlaceholder = () => (
    <PlaceholderContainer className={uploadClasses.placeholder.root}>
      <UploadIllustration sx={{ width: 180, mb: 2 }} />
      <div className={uploadClasses.placeholder.content}>
        <div className={uploadClasses.placeholder.title}>
          {multiple ? 'Solte ou selecione arquivos' : 'Solte ou selecione um arquivo'}
        </div>
        <div className={uploadClasses.placeholder.description}>
          Arraste arquivos para cá, ou <span>procure</span> no computador.
        </div>
      </div>
    </PlaceholderContainer>
  );

  const renderSingleFileLoading = () =>
    loading &&
    !multiple && (
      <CircularProgress
        size={26}
        color="primary"
        sx={{ zIndex: 9, right: 16, bottom: 16, position: 'absolute' }}
      />
    );

  const renderSingleFilePreview = () => isSingleFileSelected && <SingleFilePreview file={value} />;

  const renderMultiFilesPreview = () =>
    hasMultiFilesSelected && (
      <>
        <Box sx={{ my: 3 }}>
          <MultiFilePreview
            files={value}
            onRemove={onRemove}
            orientation={previewOrientation}
            {...slotProps?.multiPreview}
          />
        </Box>

        {(onRemoveAll || onUpload) && (
          <Box sx={{ gap: 1.5, display: 'flex', justifyContent: 'flex-end' }}>
            {onRemoveAll && (
              <Button size="small" variant="outlined" color="inherit" onClick={onRemoveAll}>
                Remover Todos
              </Button>
            )}
            {onUpload && (
              <Button
                size="small"
                variant="contained"
                onClick={onUpload}
                startIcon={<Iconify icon="solar:cloud-upload-bold-duotone" />}
                loading={loading && multiple}
                loadingPosition="start"
              >
                {loading && multiple ? 'Enviando...' : 'Fazer Upload'}
              </Button>
            )}
          </Box>
        )}
      </>
    );

  const stateClassNames = [
    uploadClasses.default,
    isDragActive ? uploadClasses.state.dragActive : '',
    disabled ? uploadClasses.state.disabled : '',
    hasError ? uploadClasses.state.error : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <UploadWrapper {...slotProps?.wrapper} className={uploadClasses.wrapper}>
      <UploadArea {...getRootProps()} className={stateClassNames} sx={sx}>
        <input {...getInputProps()} />
        {isSingleFileSelected ? renderSingleFilePreview() : renderPlaceholder()}
      </UploadArea>

      {isSingleFileSelected && (
        <DeleteButton size="small" onClick={onDelete}>
          <Iconify icon="mingcute:close-line" width={16} />
        </DeleteButton>
      )}

      {helperText && <FormHelperText error={!!error}>{helperText}</FormHelperText>}
      {showFilesRejected && <RejectedFiles files={fileRejections} {...slotProps?.rejectedFiles} />}

      {renderSingleFileLoading()}
      {renderMultiFilesPreview()}
    </UploadWrapper>
  );
}
