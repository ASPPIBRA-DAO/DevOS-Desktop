import type { Theme, SxProps } from '@mui/material/styles';

import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

// ----------------------------------------------------------------------

export interface BlockMiningCardProps {
  /** Número do bloco (padrão: 1) */
  blockNumber?: number | string;
  /** Rótulo do bloco (padrão: '(Genesis)') */
  blockTag?: string;
  /** Carimbo de data/hora (padrão: '01/01/2026 10:00:00') */
  timestamp?: string;
  /** Conteúdo ou carga de dados do bloco */
  initialData?: string;
  /** Nonce inicial */
  initialNonce?: number;
  /** Hash anterior do bloco */
  previousHash?: string;
  /** Hash atual do bloco */
  initialHash?: string;
  /** Estado de validação inicial (padrão: false) */
  isInitiallyValid?: boolean;
  /** Quantidade de zeros necessários no início do hash para considerar válido */
  difficulty?: number;
  /** Callback acionado ao minerar o bloco */
  onMine?: (result: { nonce: number; hash: string; data: string }) => void;
  /** Estilos adicionais via MUI SxProps */
  sx?: SxProps<Theme>;
  /** Classe CSS customizada */
  className?: string;
}

/* eslint-disable no-bitwise */
// Algoritmo determinístico de hash para simulação de Proof-of-Work em tempo real
function pseudoSha256(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c64e6d;
  let h3 = 0x9b05688c;
  let h4 = 0x3af3b701;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
    h3 = Math.imul(h3 ^ ch, 2246822507);
    h4 = Math.imul(h4 ^ ch, 3266489909);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h3 ^ (h3 >>> 13), 3266489909);
  h3 = Math.imul(h3 ^ (h3 >>> 16), 2246822507) ^ Math.imul(h4 ^ (h4 >>> 13), 3266489909);
  h4 = Math.imul(h4 ^ (h4 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');

  // Multiplicadores para formar uma cadeia de 64 caracteres hexadecimais
  const p1 = (hex1 + hex2 + hex3 + hex4);
  const p2 = ((h2 ^ h3) >>> 0).toString(16).padStart(8, '0') +
             ((h1 ^ h4) >>> 0).toString(16).padStart(8, '0') +
             ((h3 ^ h4) >>> 0).toString(16).padStart(8, '0') +
             ((h1 ^ h2) >>> 0).toString(16).padStart(8, '0');

  return (p1 + p2).toLowerCase();
}
/* eslint-enable no-bitwise */

// ----------------------------------------------------------------------

export function BlockMiningCard({
  blockNumber = 1,
  blockTag = '(Genesis)',
  timestamp = '01/01/2026 10:00:00',
  initialData = 'Bloco Genesis: Bem-vindo à rede Blockchain!',
  initialNonce = 2841,
  previousHash = '0000000000000000000000000000000000000000000000000000000000000000',
  initialHash = '369752b4c827283a21c984f3640da637d7e45a2ccda73711a53b8f6cc4332332',
  isInitiallyValid = false,
  difficulty = 4,
  onMine,
  sx,
  className,
  ...other
}: BlockMiningCardProps) {
  const [data] = useState(initialData);
  const [nonce, setNonce] = useState(initialNonce);
  const [hash, setHash] = useState(initialHash);
  const [isValid, setIsValid] = useState(isInitiallyValid);
  const [isMining, setIsMining] = useState(false);

  // Executa o processo de mineração iterando o Nonce
  const handleMineBlock = () => {
    if (isMining) return;
    setIsMining(true);

    setTimeout(() => {
      let currentNonce = nonce;
      let calculatedHash = '';
      const prefix = '0'.repeat(difficulty);

      for (let i = 0; i < 8000; i += 1) {
        currentNonce += 1;
        calculatedHash = pseudoSha256(`${blockNumber}${timestamp}${data}${previousHash}${currentNonce}`);
        if (calculatedHash.startsWith(prefix)) {
          break;
        }
      }

      // Se após o loop não atingir os zeros, forçamos um hash válido de demonstração
      if (!calculatedHash.startsWith(prefix)) {
        calculatedHash = `${prefix}${calculatedHash.slice(difficulty)}`;
      }

      setNonce(currentNonce);
      setHash(calculatedHash);
      setIsValid(true);
      setIsMining(false);

      if (onMine) {
        onMine({ nonce: currentNonce, hash: calculatedHash, data });
      }
    }, 450);
  };

  // Cores dinâmicas de acordo com o estado de validação
  const statusColor = isValid ? '#00A76F' : '#EF4444';
  const statusBg = isValid ? 'rgba(0, 167, 111, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const statusBorder = isValid ? 'rgba(0, 167, 111, 0.45)' : 'rgba(239, 68, 68, 0.45)';
  const glowShadow = isValid
    ? '0 0 24px -2px rgba(0, 167, 111, 0.25)'
    : '0 0 24px -2px rgba(239, 68, 68, 0.25)';

  return (
    <Box
      className={className}
      sx={[
        {
          width: '100%',
          maxWidth: 350,
          borderRadius: 2,
          bgcolor: '#090E1F',
          border: `1.5px solid ${statusBorder}`,
          boxShadow: glowShadow,
          p: { xs: 1.75, sm: 2 },
          display: 'flex',
          flexDirection: 'column',
          gap: 1.15,
          color: '#F8FAFC',
          fontFamily: 'sans-serif',
          transition: 'all 0.3s ease',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...other}
    >
      {/* 1. Cabeçalho com Ícone, Título e Badge de Status */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 26,
              height: 26,
              borderRadius: 0.75,
              bgcolor: 'rgba(0, 255, 240, 0.14)',
              color: '#00FFF0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Iconify icon="solar:box-bold" width={15} />
          </Box>

          <Stack direction="row" spacing={0.6} sx={{ alignItems: 'baseline' }}>
            <Typography
              sx={{
                fontWeight: 800,
                fontSize: '0.9rem',
                color: '#FFFFFF',
                letterSpacing: '-0.01em',
              }}
            >
              {`BLOCO #${blockNumber}`}
            </Typography>

            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.7rem',
                color: '#EAB308',
              }}
            >
              {blockTag}
            </Typography>
          </Stack>
        </Stack>

        {/* Badge de Validação */}
        <Chip
          icon={
            <Iconify
              icon={isValid ? 'solar:check-circle-bold' : 'solar:danger-triangle-bold'}
              width={12}
              sx={{ color: `${statusColor} !important` }}
            />
          }
          label={isValid ? 'VÁLIDO' : 'INVÁLIDO'}
          size="small"
          sx={{
            height: 20,
            fontSize: '0.6rem',
            fontWeight: 800,
            letterSpacing: '0.04em',
            bgcolor: statusBg,
            color: statusColor,
            border: `1px solid ${statusBorder}`,
            borderRadius: 0.75,
            px: 0.5,
          }}
        />
      </Box>

      {/* 2. Metadados do Bloco (Timestamp) */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.68rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          pb: 0.75,
        }}
      >
        <Typography sx={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600 }}>
          Timestamp:
        </Typography>
        <Typography
          sx={{
            fontSize: '0.68rem',
            color: '#38BDF8',
            fontFamily: 'monospace',
            fontWeight: 700,
          }}
        >
          {timestamp}
        </Typography>
      </Box>

      {/* 3. Campo: Data (Conteúdo) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Iconify icon="solar:database-bold" width={12} sx={{ color: '#64748B' }} />
          <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
            Data (Conteúdo):
          </Typography>
        </Stack>

        <Box
          sx={{
            px: 1,
            py: 0.65,
            borderRadius: 1,
            bgcolor: '#040711',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#E2E8F0',
            fontFamily: 'monospace',
            fontSize: '0.7rem',
            lineHeight: 1.35,
            minHeight: 32,
            wordBreak: 'break-word',
          }}
        >
          {data}
        </Box>
      </Box>

      {/* 4. Campo: Nonce (Proof of Work) */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 800 }}>#</Typography>
          <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
            Nonce (Proof of Work):
          </Typography>
        </Stack>

        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: '#040711',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#EAB308',
            fontFamily: 'monospace',
            fontSize: '0.75rem',
            fontWeight: 800,
          }}
        >
          {nonce}
        </Box>
      </Box>

      {/* 5. Campo: Previous Hash */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Iconify icon="solar:link-bold" width={12} sx={{ color: '#64748B' }} />
          <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
            Previous Hash:
          </Typography>
        </Stack>

        <Box
          sx={{
            px: 1,
            py: 0.5,
            borderRadius: 1,
            bgcolor: '#040711',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            color: '#475569',
            fontFamily: 'monospace',
            fontSize: '0.62rem',
            wordBreak: 'break-all',
            lineHeight: 1.25,
          }}
        >
          {previousHash}
        </Box>
      </Box>

      {/* 6. Campo: Hash Atual */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
        <Stack direction="row" spacing={0.5} sx={{ alignItems: 'center' }}>
          <Iconify icon="solar:key-bold" width={12} sx={{ color: '#64748B' }} />
          <Typography sx={{ fontSize: '0.68rem', color: '#94A3B8', fontWeight: 600 }}>
            Hash Atual:
          </Typography>
        </Stack>

        <Box
          sx={{
            px: 1,
            py: 0.55,
            borderRadius: 1,
            bgcolor: '#040711',
            border: `1.5px solid ${statusBorder}`,
            color: statusColor,
            fontFamily: 'monospace',
            fontSize: '0.62rem',
            fontWeight: 700,
            wordBreak: 'break-all',
            lineHeight: 1.3,
            transition: 'all 0.3s ease',
          }}
        >
          {hash}
        </Box>
      </Box>

      {/* 7. Botão: MINERAR BLOCO */}
      <Button
        variant="contained"
        fullWidth
        disabled={isMining}
        onClick={handleMineBlock}
        sx={{
          mt: 0.25,
          py: 0.85,
          borderRadius: 1.25,
          bgcolor: isValid ? '#00A76F' : '#EAB308',
          color: isValid ? '#FFFFFF' : '#0B132B',
          fontWeight: 900,
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          boxShadow: isValid
            ? '0 3px 12px rgba(0, 167, 111, 0.35)'
            : '0 3px 12px rgba(234, 179, 8, 0.35)',
          '&:hover': {
            bgcolor: isValid ? '#007867' : '#CA8A04',
          },
        }}
      >
        {isMining ? (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: 'center' }}>
            <CircularProgress size={14} sx={{ color: 'inherit' }} />
            <span>MINERANDO BLOCO...</span>
          </Stack>
        ) : (
          <span>{isValid ? 'BLOCO VALIDADO & MINERADO' : 'MINERAR BLOCO'}</span>
        )}
      </Button>
    </Box>
  );
}
