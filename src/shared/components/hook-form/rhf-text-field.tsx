import type { TextFieldProps } from '@mui/material/TextField';

import { Controller, useFormContext } from 'react-hook-form';
import { transformValue, transformValueOnBlur, transformValueOnChange } from 'minimal-shared/utils';

import TextField from '@mui/material/TextField';

// ----------------------------------------------------------------------

export type RHFTextFieldProps = Omit<TextFieldProps, 'name' | 'value' | 'defaultValue'> & {
  name: string;
};

export function RHFTextField({
  name,
  helperText,
  slotProps,
  type = 'text',
  onChange: onChangeProp,
  onBlur: onBlurProp,
  ...other
}: RHFTextFieldProps) {
  const { control } = useFormContext();

  const isNumberType = type === 'number';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <TextField
          {...other}
          {...field}
          fullWidth
          value={isNumberType ? transformValue(field.value) : (field.value ?? '')}
          onChange={(event) => {
            const transformedValue = isNumberType
              ? transformValueOnChange(event.target.value)
              : event.target.value;

            field.onChange(transformedValue);
            onChangeProp?.(event);
          }}
          onBlur={(event) => {
            if (isNumberType) {
              field.onChange(transformValueOnBlur(event.target.value));
            }

            // Mantém a notificação de blur e o controle de touched do React Hook Form
            field.onBlur();
            onBlurProp?.(event);
          }}
          type={isNumberType ? 'text' : type}
          error={!!error}
          helperText={error?.message ?? helperText}
          slotProps={{
            ...slotProps,
            htmlInput: {
              ...slotProps?.htmlInput,
              ...(isNumberType && {
                inputMode: 'decimal',
                pattern: '[0-9]*\\.?[0-9]*',
              }),
            },
          }}
        />
      )}
    />
  );
}
