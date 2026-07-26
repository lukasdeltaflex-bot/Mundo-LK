import React from 'react';
import { Award, Zap } from 'lucide-react';
import { Badge } from '../ui/Badge';

export interface OfferScoreBadgeProps {
  score: number;
  label?: string;
  showIcon?: boolean;
}

export const OfferScoreBadge: React.FC<OfferScoreBadgeProps> = ({
  score,
  label,
  showIcon = true,
}) => {
  let variant: 'success' | 'warning' | 'danger' = 'success';
  let defaultLabel = 'Oferta Excelente';

  if (score < 50) {
    variant = 'danger';
    defaultLabel = 'Preço Comum';
  } else if (score < 80) {
    variant = 'warning';
    defaultLabel = 'Boa Oferta';
  }

  return (
    <Badge variant={variant} className="gap-1.5 py-1 px-3 text-xs font-bold">
      {showIcon && (score >= 80 ? <Award className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />)}
      <span>{score}/100</span>
      <span className="opacity-80 font-normal">({label || defaultLabel})</span>
    </Badge>
  );
};
