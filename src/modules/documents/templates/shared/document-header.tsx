import React from 'react';
import { Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  headerContainer: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#00e5ff',
    borderBottomStyle: 'solid',
    paddingBottom: 10,
    marginBottom: 16,
  },
  institutionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  institutionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#00e5ff',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  documentBadge: {
    fontSize: 8,
    color: '#94a3b8',
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 0.5,
    borderColor: '#334155',
  },
  documentTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f8fafc',
    marginTop: 4,
  },
  documentSubtitle: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
});

export interface DocumentHeaderProps {
  title: string;
  subtitle?: string;
  systemTag?: string;
}

export const DocumentHeader: React.FC<DocumentHeaderProps> = ({
  title,
  subtitle,
  systemTag = 'DevOS Cockpit • Verificado',
}) => (
  <View style={styles.headerContainer} fixed>
    <View style={styles.institutionRow}>
      <Text style={styles.institutionTitle}>ASPPIBRA DAO — DevOS Core</Text>
      <Text style={styles.documentBadge}>{systemTag}</Text>
    </View>
    <Text style={styles.documentTitle}>{title}</Text>
    {subtitle && <Text style={styles.documentSubtitle}>{subtitle}</Text>}
  </View>
);
