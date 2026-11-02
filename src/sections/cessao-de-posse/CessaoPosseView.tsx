import { useState } from 'react';

import { generateDocument } from 'src/platform/tauri';

import { toast } from 'src/shared/components/snackbar';
import {
  A4Page,
  DefaultHeader,
  DefaultFooter,
  PdfViewerLayout,
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
      const sanitizedDocNum = mockData.documentNumber.replace(/[^a-zA-Z0-9]/g, '_');
      const targetFileName = `Contrato_Cessao_Posse_${sanitizedDocNum}_${Date.now()}.pdf`;

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
        target_file_name: targetFileName,
      });

      if (result.success) {
        toast.success(`PDF Oficial gerado com sucesso! Salvo em Downloads: ${result.file_name}`);
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

  const handleView = () => {
    const canvas = document.getElementById('pdf-document-canvas') || window;
    canvas.scrollTo({ top: 0, behavior: 'smooth' });
    toast.info('Visualizando Minuta Oficial da Cessão de Posse (Padrão ABNT)');
  };

  return (
    <PdfViewerLayout
      documentTitle={`Contrato_Cessao_Posse_${mockData.documentNumber.replace(/[^a-zA-Z0-9]/g, '_')}`}
      onView={handleView}
      onExport={handleExportNativePdf}
      isExporting={isExporting}
      viewButtonText="Visualizar"
      exportButtonText="Exportar"
    >
      <DocumentDataProvider data={mockData}>
        {/* Folha A4 Oficial do Contrato */}
        <A4Page
          pageNumber={1}
          headerContent={<DefaultHeader documentNumber={mockData.documentNumber} />}
          footerContent={
            <DefaultFooter
              authCode={mockData.authCode}
              pageNumber={1}
              totalPages={1}
            />
          }
        >
          <CessaoPosseContent />
        </A4Page>
      </DocumentDataProvider>
    </PdfViewerLayout>
  );
}
