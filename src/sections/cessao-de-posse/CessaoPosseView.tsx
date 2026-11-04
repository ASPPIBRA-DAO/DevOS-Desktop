import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';

import {
  previewDocument,
  generateDocument,
  exportPreviewedDocument,
  type DocumentPreviewResult,
} from 'src/platform/tauri';

import { toast } from 'src/shared/components/snackbar';
import { PdfViewerLayout } from 'src/shared/components/pdf-viewer';
import {
  A4Page,
  DefaultHeader,
  DefaultFooter,
  DocumentDataProvider,
} from 'src/shared/components/abnt-document';

import { CessaoPosseContent } from './CessaoPosseContent';

export type ExportCessaoPosseParams = {
  documentNumber: string;
  authCode: string;
  data?: Record<string, unknown>;
  preview?: DocumentPreviewResult | null;
};

export async function exportCessaoPossePdf({
  documentNumber,
  authCode,
  data = {},
  preview,
}: ExportCessaoPosseParams): Promise<boolean> {
  const trimmedDocNumber = documentNumber.trim();
  const trimmedAuthCode = authCode.trim();

  if (!trimmedDocNumber || !trimmedAuthCode) {
    toast.error(
      'Informe o Nº do Documento Oficial e o Código de Controle antes de exportar o contrato.'
    );
    return false;
  }

  const sanitizedDocNum = trimmedDocNumber.replace(/[^a-zA-Z0-9]/g, '_');
  const targetFileName = `Contrato_Cessao_Posse_${sanitizedDocNum}_${Date.now()}.pdf`;

  // Quando existe um preview verificado em memória, exporta o binário idêntico sem recompilar
  if (preview?.preview_id && preview.metadata.sha256_checksum) {
    const result = await exportPreviewedDocument({
      preview_id: preview.preview_id,
      expected_sha256: preview.metadata.sha256_checksum,
      open_after_export: true,
      target_file_name: targetFileName,
    });

    if (result.success) {
      toast.success(`PDF Oficial verificado e exportado com sucesso! Salvo em Downloads: ${result.file_name}`);
      return true;
    }

    toast.error(result.message || 'Falha ao exportar contrato');
    return false;
  }

  const payloadData: Record<string, unknown> = {
    originIdentifier: 'ASPPIBRA',
    asppibraBanco: '403 - Cora SCD',
    asppibraAgencia: '0001',
    asppibraConta: '6193441-3',
    asppibraChavePix: '26.325.396/0001-30',
    ...data,
    documentNumber: trimmedDocNumber,
    authCode: trimmedAuthCode,
  };

  const result = await generateDocument({
    request: {
      kind: 'cessao_posse',
      payload: {
        document_number: trimmedDocNumber,
        auth_code: trimmedAuthCode,
        data: payloadData,
      },
    },
    open_after_export: true,
    target_file_name: targetFileName,
  });

  if (result.success) {
    toast.success(`PDF Oficial gerado com sucesso! Salvo em Downloads: ${result.file_name}`);
    return true;
  }

  toast.error(result.message || 'Falha ao compilar contrato');
  return false;
}

export function CessaoPosseView() {
  const [isExporting, setIsExporting] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [preview, setPreview] = useState<DocumentPreviewResult | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [documentNumber, setDocumentNumber] = useState('');
  const [authCode, setAuthCode] = useState('');

  const trimmedDocNumber = documentNumber.trim();
  const trimmedAuthCode = authCode.trim();

  const documentData = {
    documentNumber: trimmedDocNumber,
    authCode: trimmedAuthCode,
    originIdentifier: 'ASPPIBRA',
    asppibraBanco: '403 - Cora SCD',
    asppibraAgencia: '0001',
    asppibraConta: '6193441-3',
    asppibraChavePix: '26.325.396/0001-30',
  };

  const handleExportNativePdf = async () => {
    if (!trimmedDocNumber || !trimmedAuthCode) {
      toast.error(
        'Informe o Nº do Documento Oficial e o Código de Controle antes de exportar o contrato.'
      );
      return;
    }

    setIsExporting(true);
    try {
      await exportCessaoPossePdf({
        documentNumber: trimmedDocNumber,
        authCode: trimmedAuthCode,
        data: documentData,
        preview,
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Falha ao compilar o contrato em PDF';
      console.error('Erro na geração nativa de PDF:', err);
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handleView = async () => {
    if (!trimmedDocNumber || !trimmedAuthCode) {
      toast.error(
        'Informe o Nº do Documento Oficial e o Código de Controle antes de visualizar o contrato.'
      );
      return;
    }

    setIsViewing(true);
    setPreviewError(null);
    try {
      const res = await previewDocument({
        request: {
          kind: 'cessao_posse',
          payload: {
            document_number: trimmedDocNumber,
            auth_code: trimmedAuthCode,
            data: documentData,
          },
        },
      });
      setPreview(res);
      toast.success('Visualização do PDF real compilada com sucesso via Typst!');
      const canvas = document.getElementById('pdf-document-canvas') || window;
      canvas.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao gerar visualização do contrato';
      setPreviewError(msg);
      toast.error(msg);
    } finally {
      setIsViewing(false);
    }
  };

  const displayDocSlug = trimmedDocNumber
    ? trimmedDocNumber.replace(/[^a-zA-Z0-9]/g, '_')
    : 'Pendente_Identificacao';

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          p: 2,
          borderRadius: 1.5,
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
          Identificação Documental Obrigatória para Emissão Oficial
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            fullWidth
            size="small"
            label="Nº do Documento Oficial"
            placeholder="Informe o número oficial de registro"
            value={documentNumber}
            onChange={(event) => setDocumentNumber(event.target.value)}
          />
          <TextField
            fullWidth
            size="small"
            label="Código de Controle / Rastreabilidade"
            placeholder="Informe o código oficial de controle"
            value={authCode}
            onChange={(event) => setAuthCode(event.target.value)}
          />
        </Stack>
      </Box>

      <PdfViewerLayout
        documentTitle={`Contrato_Cessao_Posse_${displayDocSlug}`}
        preview={preview}
        onView={handleView}
        onExport={handleExportNativePdf}
        isViewing={isViewing}
        isExporting={isExporting}
        errorMessage={previewError}
        onRetry={handleView}
        viewButtonText="Visualizar"
        exportButtonText="Exportar"
      >
        <DocumentDataProvider data={documentData}>
          {/* Folha A4 Oficial do Contrato */}
          <A4Page
            pageNumber={1}
            headerContent={<DefaultHeader documentNumber={trimmedDocNumber} />}
            footerContent={
              <DefaultFooter
                authCode={trimmedAuthCode}
                pageNumber={1}
                totalPages={1}
              />
            }
          >
            <CessaoPosseContent />
          </A4Page>
        </DocumentDataProvider>
      </PdfViewerLayout>
    </Stack>
  );
}
