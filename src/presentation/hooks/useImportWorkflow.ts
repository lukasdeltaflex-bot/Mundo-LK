'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importAndGenerateOfferAction, ImportOfferActionInput } from '../actions/import-offer.action';
import { useAuth } from '../context/AuthContext';

export function useImportWorkflow() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const mutation = useMutation({
    mutationFn: async (input: Omit<ImportOfferActionInput, 'userId'>) => {
      const res = await importAndGenerateOfferAction({
        ...input,
        userId: user?.uid,  // Pass real authenticated userId
      });
      if (!res.success) {
        throw new Error(res.error || 'Falha ao gerar oferta.');
      }
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  return {
    importOffer: mutation.mutateAsync,
    isLoading:   mutation.isPending,
    error:       mutation.error ? (mutation.error as Error).message : null,
    data:        mutation.data,
    reset:       mutation.reset,
  };
}
