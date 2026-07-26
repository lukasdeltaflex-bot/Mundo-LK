'use client';

import React, { useState } from 'react';
import { Star, CheckCircle2 } from 'lucide-react';

export interface OfferRatingWidgetProps {
  offerId: string;
  userId?: string;
  onRated?: (rating: number) => void;
}

export const OfferRatingWidget: React.FC<OfferRatingWidgetProps> = ({
  offerId,
  onRated,
}) => {
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = (stars: number) => {
    setRating(stars);
    setSubmitted(true);
    if (onRated) onRated(stars);
    console.log(`[AIFeedbackEngine] Rated offer ${offerId} with ${stars} stars.`);
  };

  return (
    <div className="flex items-center gap-3 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 text-xs">
      <span className="text-slate-400 font-medium">Avaliar geração da IA:</span>

      {submitted ? (
        <span className="flex items-center gap-1.5 text-emerald-400 font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="h-4 w-4" />
          <span>Obrigado pelo feedback! IA atualizada ({rating}★).</span>
        </span>
      ) : (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRate(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
              className="p-1 transition hover:scale-110"
            >
              <Star
                className={`h-4 w-4 ${
                  (hoverRating || rating || 0) >= star
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-slate-600'
                }`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
