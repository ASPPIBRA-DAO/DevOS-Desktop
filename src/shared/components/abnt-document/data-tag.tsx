import Box from '@mui/material/Box';

import { useDocumentData } from './document-context';

type DataTagProps = {
  text?: string;
  field?: string;
};

export function DataTag({ text = 'PREENCHIMENTO AUTOMÁTICO', field }: DataTagProps) {
  const contextData = useDocumentData();

  const lookupField = field || text;
  const contextValue = contextData ? contextData[lookupField] : undefined;

  if (contextValue) {
    return (
      <Box component="span" sx={{ fontWeight: 'bold', textDecoration: 'underline' }}>
        {contextValue}
      </Box>
    );
  }

  return (
    <Box
      component="span"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.1,
        mx: 0.5,
        borderRadius: 0.5,
        fontSize: '10pt',
        fontWeight: '900',
        bgcolor: '#D4AF371A', // 1A hex = 10% opacity Gold
        color: '#B8860B', // Dark Goldenrod for high readability
        border: '1px solid #D4AF37', // Pure Gold border
        textIndent: '0cm',
      }}
    >
      {text}
    </Box>
  );
}
