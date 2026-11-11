import type { CardProps } from '@mui/material/Card';
import type { CommunicationItem, CommunicationPriority } from '../types/home';

import useEmblaCarousel from 'embla-carousel-react';
import { useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { RouterLink } from 'src/app/router/components/router-link';

import { Image } from 'src/shared/components/image';
import { Iconify } from 'src/shared/components/iconify';

type Props = CardProps & {
  list: CommunicationItem[];
};

export function AppCommunicationCarousel({ list, sx, ...other }: Props) {
  const [filter, setFilter] = useState<string>('todos');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredList = list.filter((item) => {
    if (filter === 'todos') return true;
    return item.priority === filter;
  });

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on('select', onSelect);
      onSelect();

      // Autoplay nativo a cada 5 segundos
      const timer = setInterval(() => {
        emblaApi.scrollNext();
      }, 5000);

      return () => {
        clearInterval(timer);
        emblaApi.off('select', onSelect);
      };
    }
    return undefined;
  }, [emblaApi, onSelect]);

  return (
    <Card
      sx={{
        borderRadius: 2,
        overflow: 'hidden',
        bgcolor: 'background.paper',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        boxShadow: (theme) => theme.customShadows?.card || 1,
        ...sx,
      }}
      {...other}
    >
      {/* Filtros de Comunicação */}
      <Stack
        direction="row"
        sx={{
          px: 2.5,
          py: 1.5,
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 0.5 }}>
          {[
            { label: 'Todos', value: 'todos' },
            { label: 'Urgentes', value: 'urgente' },
            { label: 'Importantes', value: 'importante' },
            { label: 'Novidades', value: 'novidade' },
            { label: 'Destaques', value: 'destaque' },
          ].map((tab) => (
            <Chip
              key={tab.value}
              label={tab.label}
              size="small"
              clickable
              color={filter === tab.value ? 'primary' : 'default'}
              variant={filter === tab.value ? 'filled' : 'outlined'}
              onClick={() => {
                setFilter(tab.value);
                setSelectedIndex(0);
              }}
              sx={{ fontWeight: 'medium', fontSize: '0.75rem' }}
            />
          ))}
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={scrollPrev} aria-label="Anterior">
            <Iconify icon="eva:arrow-ios-back-fill" width={18} />
          </IconButton>
          <IconButton size="small" onClick={scrollNext} aria-label="Próximo">
            <Iconify icon="eva:arrow-ios-forward-fill" width={18} />
          </IconButton>
        </Stack>
      </Stack>

      {/* Carrossel Embla */}
      <Box ref={emblaRef} sx={{ overflow: 'hidden' }}>
        <Box sx={{ display: 'flex' }}>
          {filteredList.map((item) => (
            <Box key={item.id} sx={{ flex: '0 0 100%', minWidth: 0 }}>
              <CarouselItem item={item} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* Indicadores / Pontos */}
      {filteredList.length > 1 && (
        <Stack direction="row" spacing={1} sx={{ py: 1.5, justifyContent: 'center' }}>
          {filteredList.map((item, idx) => (
            <Box
              key={item.id}
              onClick={() => emblaApi?.scrollTo(idx)}
              sx={{
                width: idx === selectedIndex ? 18 : 6,
                height: 6,
                borderRadius: 3,
                cursor: 'pointer',
                bgcolor: idx === selectedIndex ? 'primary.main' : 'action.disabled',
                transition: (theme) =>
                  theme.transitions.create(['width', 'background-color'], {
                    duration: theme.transitions.duration.shorter,
                  }),
              }}
            />
          ))}
        </Stack>
      )}
    </Card>
  );
}

function CarouselItem({ item }: { item: CommunicationItem }) {
  const theme = useTheme();

  const getPriorityColor = (priority: CommunicationPriority) => {
    switch (priority) {
      case 'urgente':
        return theme.palette.error.main;
      case 'importante':
        return theme.palette.warning.main;
      case 'novidade':
        return theme.palette.info.main;
      case 'destaque':
      default:
        return theme.palette.success.main;
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: { xs: 240, md: 280 },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <Image
        alt={item.title}
        src={item.coverUrl}
        sx={{
          width: 1,
          height: 1,
          position: 'absolute',
          '& img': { objectFit: 'cover' },
        }}
      />

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: 1,
          height: 1,
          bgcolor: 'rgba(0, 0, 0, 0.65)',
        }}
      />

      <Stack
        spacing={1.5}
        sx={{
          position: 'relative',
          zIndex: 1,
          textAlign: 'center',
          px: 3,
          maxWidth: 600,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Chip
          label={item.priority.toUpperCase()}
          size="small"
          sx={{
            bgcolor: getPriorityColor(item.priority),
            color: 'white',
            fontWeight: 'bold',
            fontSize: '0.65rem',
            letterSpacing: 0.5,
          }}
        />

        <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
          {item.title}
        </Typography>

        <Typography variant="body2" sx={{ color: 'grey.300', lineHeight: 1.6 }}>
          {item.description}
        </Typography>

        {item.linkText && item.linkUrl && (
          <Button
            component={RouterLink}
            href={item.linkUrl}
            variant="contained"
            color="primary"
            size="medium"
            sx={{ mt: 1 }}
          >
            {item.linkText}
          </Button>
        )}
      </Stack>
    </Box>
  );
}
