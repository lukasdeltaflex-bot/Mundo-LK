'use client';

import React from 'react';
import { useFormContext, Controller } from 'react-hook-form';
import { Input, InputProps } from '../ui/Input';

export interface FormInputProps extends Omit<InputProps, 'name'> {
  name: string;
}

export const FormInput: React.FC<FormInputProps> = ({ name, ...props }) => {
  const { control } = useFormContext();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error } }) => (
        <Input
          {...field}
          {...props}
          value={field.value ?? ''}
          error={error?.message}
        />
      )}
    />
  );
};
