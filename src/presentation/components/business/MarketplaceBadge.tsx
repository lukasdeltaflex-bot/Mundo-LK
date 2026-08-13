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

  let colorDot = 'bg-purple-400';
  let label = marketplaceSlug
    ? marketplaceSlug.charAt(0).toUpperCase() + marketplaceSlug.slice(1)
    : 'Marketplace';
  let borderStyle = 'border-purple-500/30 bg-purple-500/10 text-purple-300';

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
  } else if (slug.includes('shein')) {
    colorDot = 'bg-pink-400';
    label = 'SHEIN';
    borderStyle = 'border-pink-500/30 bg-pink-500/10 text-pink-300';
  } else if (slug.includes('tiktok')) {
    colorDot = 'bg-cyan-400';
    label = 'TikTok Shop';
    borderStyle = 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300';
  } else if (slug.includes('casasbahia') || slug.includes('via')) {
    colorDot = 'bg-blue-500';
    label = 'Casas Bahia';
    borderStyle = 'border-blue-600/30 bg-blue-600/10 text-blue-300';
  } else if (slug.includes('kabum')) {
    colorDot = 'bg-amber-500';
    label = 'KabuM!';
    borderStyle = 'border-amber-500/30 bg-amber-500/10 text-amber-300';
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border ${borderStyle} ${className}`}>
      <span className={`h-2 w-2 rounded-full ${colorDot} animate-pulse`} />
      <span>{label}</span>
    </span>
  );
};
