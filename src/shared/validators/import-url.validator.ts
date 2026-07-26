import { z } from 'zod';

export const ImportUrlSchema = z.object({
  url: z
    .string({ message: 'A URL do produto é obrigatória.' })
    .min(1, 'A URL do produto é obrigatória.')
    .url('Informe uma URL válida (ex: https://shopee.com.br/product/...)'),
  affiliateTag: z.string().optional(),
});

export type ImportUrlFormData = z.infer<typeof ImportUrlSchema>;
