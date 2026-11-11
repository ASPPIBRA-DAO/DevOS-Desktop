import type { ActiveProject } from '../types/home';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardHeader from '@mui/material/CardHeader';
import LinearProgress from '@mui/material/LinearProgress';

import { RouterLink } from 'src/app/router/components/router-link';

type Props = {
  projects: ActiveProject[];
};

export function AppActiveProjects({ projects }: Props) {
  return (
    <Card sx={{ borderRadius: 2 }}>
      <CardHeader title="Projetos em Evidência" subheader="Acompanhamento das iniciativas comunitárias" />

      <Stack spacing={2.5} sx={{ p: 2.5 }}>
        {projects.map((project) => (
          <Box key={project.id}>
            <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography
                component={RouterLink}
                href={project.highlightUrl || '/devos/infrastructure'}
                variant="subtitle2"
                sx={{
                  color: 'text.primary',
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                }}
              >
                {project.name}
              </Typography>
              <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                {project.progress}%
              </Typography>
            </Stack>

            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
              {project.summary}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={project.progress}
              color={project.progress > 80 ? 'success' : 'primary'}
              sx={{ height: 6, borderRadius: 1 }}
            />
          </Box>
        ))}
      </Stack>
    </Card>
  );
}
