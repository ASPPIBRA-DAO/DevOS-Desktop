import Typography from '@mui/material/Typography';

export function DocumentTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography
      variant="body1"
      sx={{
        mb: 2,
        color: '#000000',
        fontWeight: 'bold',
        textAlign: 'center',
        textTransform: 'uppercase',
        fontSize: '12pt',
        lineHeight: 1.5,
      }}
    >
      {children}
    </Typography>
  );
}
