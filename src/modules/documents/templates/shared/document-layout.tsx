import React from 'react';
import { Page, StyleSheet } from '@react-pdf/renderer';

import { DocumentFooter } from './document-footer';
import { DocumentHeader } from './document-header';

const styles = StyleSheet.create({
  page: {
    paddingTop: 32,
    paddingBottom: 48,
    paddingHorizontal: 32,
    fontSize: 9,
    fontFamily: 'Helvetica',
    backgroundColor: '#0a0e17',
    color: '#e2e8f0',
  },
});

export interface DocumentLayoutProps {
  title: string;
  subtitle?: string;
  systemTag?: string;
  documentHash?: string;
  generatedAt?: string;
  children: React.ReactNode;
}

export const DocumentLayout: React.FC<DocumentLayoutProps> = ({
  title,
  subtitle,
  systemTag,
  documentHash,
  generatedAt,
  children,
}) => (
  <Page size="A4" style={styles.page}>
    <DocumentHeader title={title} subtitle={subtitle} systemTag={systemTag} />
    {children}
    <DocumentFooter documentHash={documentHash} generatedAt={generatedAt} />
  </Page>
);
