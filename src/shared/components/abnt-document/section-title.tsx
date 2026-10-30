import Typography from '@mui/material/Typography';

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="body1"
      sx={{
        mt: 2.5,
        mb: 1.5,
        color: '#000000',
        fontWeight: 'bold',
        textTransform: 'uppercase',
        fontSize: '12pt',
        textAlign: 'left',
        lineHeight: 1.5,
        pageBreakAfter: 'avoid',
      }}
    >
      {children}
    </Typography>
  );
}
