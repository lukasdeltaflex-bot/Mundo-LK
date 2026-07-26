import React from 'react';

export interface MarketplaceBadgeProps {
  marketplaceSlug: string;
  className?: string;
}

export const MarketplaceBadge: React.FC<MarketplaceBadgeProps> = ({
  marketplaceSlug,
  className = '',
}) => {
  const slug = marketplaceSlug.toLowerCase();

  let colorDot = 'bg-slate-400';
  let label = 'Marketplace';
  let borderStyle = 'border-slate-800 bg-slate-900 text-slate-300';

  if (slug.includes('mercadolivre') || slug.includes('mercado livre')) {
    colorDot = 'bg-yellow-400';
    label = 'Mercado Livre';
    borderStyle = 'border-yellow-500/30 bg-yellow-500/10 text-yellow-300';
  } else if (slug.includes('shopee')) {
    colorDot = 'bg-orange-500';
    label = 'Shopee';
    borderStyle = 'border-orange-500/30 bg-orange-500/10 text-orange-300';
  } else if (slug.includes('amazon')) {
    colorDot = 'bg-blue-400';
    label = 'Amazon BR';
    borderStyle = 'border-blue-500/30 bg-blue-500/10 text-blue-300';
  } else if (slug.includes('aliexpress')) {
    colorDot = 'bg-red-500';
    label = 'AliExpress';
    borderStyle = 'border-red-500/30 bg-red-500/10 text-red-300';
  } else if (slug.includes('magalu') || slug.includes('magazine')) {
    colorDot = 'bg-sky-400';
    label = 'Magalu';
    borderStyle = 'border-sky-500/30 bg-sky-500/10 text-sky-300';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${borderStyle} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${colorDot} animate-pulse`} />
      <span>{label}</span>
    </span>
  );
};
