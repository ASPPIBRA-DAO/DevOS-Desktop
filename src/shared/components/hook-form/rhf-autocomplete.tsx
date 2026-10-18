import type { TextFieldProps } from '@mui/material/TextField';
import type { AutocompleteProps } from '@mui/material/Autocomplete';

import { Controller, useFormContext } from 'react-hook-form';

import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';

// ----------------------------------------------------------------------

type Multiple = boolean | undefined;
type DisableClearable = boolean | undefined;
type FreeSolo = boolean | undefined;

type ExcludedProps = 'renderInput';

export type AutocompleteBaseProps = Omit<
  AutocompleteProps<any, Multiple, DisableClearable, FreeSolo>,
  ExcludedProps
>;

export type RHFAutocompleteProps = AutocompleteBaseProps & {
  name: string;
  label?: string;
  placeholder?: string;
  helperText?: React.ReactNode;
  slotProps?: AutocompleteBaseProps['slotProps'] & {
    textField?: Partial<TextFieldProps>;
  };
};

export function RHFAutocomplete({
  name,
  label,
  slotProps,
  helperText,
  placeholder,
  ...other
}: RHFAutocompleteProps) {
  const { control } = useFormContext();

  const { textField, ...otherSlotProps } = slotProps ?? {};

  const { multiple, freeSolo } = other;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => {
        const { ref, ...fieldProps } = field;

        return (
          <Autocomplete
            {...fieldProps}
            {...other}
            id={`${name}-rhf-autocomplete`}
            onChange={(event, newValue) => field.onChange(newValue)}
            onBlur={(event) => {
              field.onBlur();
              if (freeSolo && multiple) {
                const inputValue = (event.target as HTMLInputElement).value;
                if (inputValue) {
                  const currentValues = Array.isArray(field.value) ? field.value : [];
                  if (!currentValues.includes(inputValue)) {
                    field.onChange([...currentValues, inputValue]);
                  }
                  (event.target as HTMLInputElement).value = '';
                }
              }
            }}
            onKeyDown={(event) => {
              if (freeSolo && multiple && event.key === ',') {
                event.preventDefault();
                const inputValue = (event.target as HTMLInputElement).value;
                if (inputValue) {
                  const currentValues = Array.isArray(field.value) ? field.value : [];
                  if (!currentValues.includes(inputValue)) {
                    field.onChange([...currentValues, inputValue]);
                  }
                  (event.target as HTMLInputElement).value = '';
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={label}
                placeholder={placeholder}
                error={!!error}
                helperText={error?.message ?? helperText}
                {...textField}
                inputRef={(node) => {
                  // Sincroniza a ref do React Hook Form
                  ref(node);
                  // Sincroniza a ref interna do Autocomplete do MUI
                  const p = params as any;
                  if (p.InputProps?.ref) {
                    p.InputProps.ref.current = node;
                  }
                  if (p.inputRef) {
                    p.inputRef.current = node;
                  }
                  if (p.slotProps?.input?.ref) {
                    p.slotProps.input.ref.current = node;
                  }
                }}
                slotProps={{
                  ...params.slotProps,
                  ...textField?.slotProps,
                  htmlInput: {
                    ...(params as any).inputProps,
                    ...textField?.slotProps?.htmlInput,
                    autoComplete: 'new-password',
                  },
                }}
              />
            )}
            slotProps={{
              ...otherSlotProps,
              chip: {
                size: 'small',
                variant: 'filled',
                ...otherSlotProps?.chip,
              },
            }}
            {...other}
          />
        );
      }}
    />
  );
}
