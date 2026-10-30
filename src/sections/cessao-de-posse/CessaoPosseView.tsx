import { useState } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { generateDocument } from 'src/platform/tauri';

import { toast } from 'src/shared/components/snackbar';
import { Iconify } from 'src/shared/components/iconify';
import {
  A4Page,
  DefaultHeader,
  DefaultFooter,
  DocumentDataProvider,
} from 'src/shared/components/abnt-document';

import { CessaoPosseContent } from './CessaoPosseContent';

export function CessaoPosseView() {
  const [isExporting, setIsExporting] = useState(false);

  const mockData = {
    documentNumber: '2026-0001/CP',
    authCode: '2026-X7Y9',
    originIdentifier: 'ASPPIBRA',
    asppibraBanco: '403 - Cora SCD',
    asppibraAgencia: '0001',
    asppibraConta: '6193441-3',
    asppibraChavePix: '26.325.396/0001-30',
  };

  const handleExportNativePdf = async () => {
    setIsExporting(true);
    try {
      const result = await generateDocument({
        request: {
          kind: 'cessao_posse',
          payload: {
            document_number: mockData.documentNumber,
            auth_code: mockData.authCode,
            data: mockData,
          },
        },
        open_after_export: true,
      });

      if (result.success) {
        toast.success(`PDF compilado via Typst! Salvo em: ${result.file_name}`);
      } else {
        toast.error(result.message || 'Falha ao compilar contrato');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Falha ao compilar o contrato em PDF';
      console.error('Erro na geração nativa de PDF:', err);
      toast.error(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      const originalTitle = document.title;
      document.title = 'Instrumento_Cessao_Posse_Imovel.pdf';
      window.print();
      document.title = originalTitle;
    }
  };

  return (
    <DocumentDataProvider data={mockData}>
      <Stack spacing={2.5} sx={{ minWidth: 0, width: '100%', alignItems: 'center' }}>
        {/* Barra de Ações Integrada do DevOS (oculta na impressão) */}
        <Box
          className="no-print"
          sx={{
            width: '100%',
            maxWidth: '210mm',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: 'background.paper',
            p: 2,
            borderRadius: 1.5,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: (theme) => theme.customShadows?.z1 || '0 1px 3px rgba(0,0,0,0.06)',
            '@media print': { display: 'none !important' },
          }}
        >
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
              Instrumento de Cessão de Posse de Imóvel
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
              Minuta ABNT Oficial • Motor Nativo Typst • Validação ASPPIBRA DAO
            </Typography>
          </Box>

          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<Iconify icon={'solar:printer-bold-duotone' as any} width={18} />}
              onClick={handlePrint}
              sx={{ fontWeight: 600 }}
            >
              Imprimir Web
            </Button>

            <Button
              variant="contained"
              color="primary"
              loading={isExporting}
              startIcon={<Iconify icon={'solar:file-download-bold' as any} width={18} />}
              onClick={handleExportNativePdf}
              sx={{ fontWeight: 700 }}
            >
              Baixar PDF Oficial (Typst)
            </Button>
          </Stack>
        </Box>

        {/* Folha A4 do Contrato */}
        <A4Page
          pageNumber={1}
          headerContent={<DefaultHeader />}
          footerContent={
            <DefaultFooter
              originIdentifier="ASPPIBRA"
              authCode={mockData.authCode}
              message={
                <>
                  Documento registrado e padronizado perante a comissão técnica da ASPPIBRA.<br />
                  Válido para fins de instrução de procedimento de regularização fundiária e usucapião extrajudicial.
                </>
              }
            />
          }
        >
          <CessaoPosseContent />
        </A4Page>
      </Stack>
    </DocumentDataProvider>
  );
}
