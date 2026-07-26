'use client';

import React from 'react';
import { useForm, FormProvider, FieldValues, UseFormProps } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

export interface FormWrapperProps<T extends FieldValues> {
  schema: z.ZodType<T>;
  onSubmit: (data: T) => void | Promise<void>;
  children: React.ReactNode;
  formProps?: UseFormProps<T>;
  className?: string;
}

export function FormWrapper<T extends FieldValues>({
  schema,
  onSubmit,
  children,
  formProps,
  className,
}: FormWrapperProps<T>) {
  const methods = useForm<T>({
    ...formProps,
    resolver: zodResolver(schema as unknown as Parameters<typeof zodResolver>[0]) as unknown as UseFormProps<T>['resolver'],
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit as unknown as Parameters<typeof methods.handleSubmit>[0])} className={className}>
        {children}
      </form>
    </FormProvider>
  );
}
