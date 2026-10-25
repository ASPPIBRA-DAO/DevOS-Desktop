import type React from 'react';
import type { DocumentProps } from '@react-pdf/renderer';

import { pdf } from '@react-pdf/renderer';

export class PdfExportService {
  /**
   * Converte uma árvore de componentes React-PDF em um Blob de formato application/pdf.
   */
  static async renderToBlob(documentElement: React.ReactElement<DocumentProps>): Promise<Blob> {
    const instance = pdf(documentElement);
    const blob = await instance.toBlob();
    return blob;
  }

  /**
   * Dispara o download do arquivo PDF na WebView do desktop.
   */
  static downloadPdf(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  /**
   * Cria uma URL de objeto temporária para pré-visualização em iframes ou modais.
   */
  static createPreviewUrl(blob: Blob): string {
    return URL.createObjectURL(blob);
  }

  /**
   * Libera uma URL de objeto após o término da pré-visualização.
   */
  static revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}
