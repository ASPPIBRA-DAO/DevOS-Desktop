import type { SyntheticEvent } from 'react';
import type { IFinancialProfile } from '../../../domain/ledger-models';

import { useState } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import { alpha } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';

import { Iconify } from 'src/shared/components/iconify';

import { useGetCitizens } from '../../hooks/treasury-hooks';

// ----------------------------------------------------------------------

type Props = {
  onSelectAssociate: (associateId: string | null) => void;
  selectedAssociateId: string | null;
  selectedProfile: IFinancialProfile | null;
};

export function AssociateSearchCard({ onSelectAssociate, selectedAssociateId, selectedProfile }: Props) {
  const [inputValue, setInputValue] = useState('');
  const { citizens, citizensLoading } = useGetCitizens();

  const handleSelect = (event: SyntheticEvent, newValue: any | null) => {
    onSelectAssociate(newValue ? String(newValue.id) : null);
  };

  return (
    <Card sx={{ p: 3, mb: 3 }}>
      <Typography variant="overline" sx={{ color: 'text.disabled', mb: 2, display: 'block' }}>
        CONSULTAR ASSOCIADO
      </Typography>

      <Autocomplete
        options={citizens}
        loading={citizensLoading}
        getOptionLabel={(option) => `${option.name} - ID: ${option.aspId}`}
        isOptionEqualToValue={(option, value) => String(option.id) === String(value?.id)}
        value={citizens.find((c) => String(c.id) === String(selectedAssociateId)) || null}
        onChange={handleSelect}
        inputValue={inputValue}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params: any) => (
          <TextField
            {...params}
            placeholder="🔍 Buscar por Nome, CPF ou ASP-ID"
            InputProps={{
              ...(params.InputProps || {}),
              startAdornment: (
                <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
                  <Iconify icon="eva:search-fill" sx={{ color: 'text.disabled', mr: 1 }} />
                  {params.InputProps?.startAdornment}
                </Box>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" sx={{ fontWeight: 'fontWeightMedium' }}>
                {option.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {option.aspId}
              </Typography>
            </Box>
          </li>
        )}
      />

      {selectedProfile && (
        <Box
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 1.5,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box
            sx={{
              width: 48,
              height: 48,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 1.5,
              color: 'primary.main',
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
            }}
          >
            <Iconify icon="solar:user-id-bold" width={28} />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 700 }}>
              CONSULTANDO
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.primary' }}>
              {selectedProfile.associate.name}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              ASP-{selectedProfile.associate.id} | CPF {selectedProfile.associate.cpf.replace(/^(\d{3}).*/, '$1.***.***-**')} | Status: {selectedProfile.associate.status === 'active' ? 'Ativo' : 'Suspenso'}
            </Typography>
          </Box>
        </Box>
      )}
    </Card>
  );
}
