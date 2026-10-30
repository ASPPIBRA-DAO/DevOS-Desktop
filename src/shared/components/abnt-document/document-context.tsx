import { useContext, createContext } from 'react';

export type DocumentDataContextValue = Record<string, string | number | undefined>;

export const DocumentDataContext = createContext<DocumentDataContextValue | null>(null);

export function useDocumentData() {
  return useContext(DocumentDataContext);
}

export function DocumentDataProvider({
  data,
  children,
}: {
  data: DocumentDataContextValue;
  children: React.ReactNode;
}) {
  return <DocumentDataContext.Provider value={data}>{children}</DocumentDataContext.Provider>;
}
