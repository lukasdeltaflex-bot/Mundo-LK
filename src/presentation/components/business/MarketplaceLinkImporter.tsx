'use client';

import React from 'react';
import { OfferCreationFlow } from './OfferCreationFlow';

export const MarketplaceLinkImporter: React.FC = () => {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl p-2 md:p-4 backdrop-blur-md">
      <OfferCreationFlow />
    </div>
  );
};
