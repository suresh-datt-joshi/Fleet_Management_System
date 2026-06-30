import { TextField } from '@mui/material';
import { Controller } from 'react-hook-form';

const FormTextField = ({ name, control, label, type = 'text', inputProps, ...props }) => (
  <Controller
    name={name}
    control={control}
    render={({ field, fieldState: { error } }) => (
      <TextField
        {...field}
        {...props}
        fullWidth
        label={label}
        type={type}
        inputProps={type === 'number' ? { step: 'any', ...inputProps } : inputProps}
        error={!!error}
        helperText={error?.message}
        margin="normal"
      />
    )}
  />
);

export default FormTextField;
