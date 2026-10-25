import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  footerContainer: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    borderTopWidth: 0.5,
    borderTopColor: '#334155',
    borderTopStyle: 'solid',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftMeta: {
    fontSize: 7,
    color: '#64748b',
  },
  pageNumber: {
    fontSize: 7,
    color: '#94a3b8',
    fontWeight: 'bold',
  },
});

export interface DocumentFooterProps {
  documentHash?: string;
  generatedAt?: string;
}

export const DocumentFooter: React.FC<DocumentFooterProps> = ({
  documentHash,
  generatedAt = new Date().toISOString(),
}) => (
  <View style={styles.footerContainer} fixed>
    <Text style={styles.leftMeta}>
      Emissão DevOS: {generatedAt}
      {documentHash ? ` • Hash: ${documentHash.slice(0, 16)}...` : ''}
    </Text>
    <Text
      style={styles.pageNumber}
      render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`}
    />
  </View>
);
