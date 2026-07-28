'use client';

import React from 'react';
import { SocialShareModal, SocialShareData } from '@/presentation/components/business/SocialShareModal';

interface PublishPanelModalProps {
  data: SocialShareData;
  onClose: () => void;
}

export const PublishPanelModal: React.FC<PublishPanelModalProps> = ({ data, onClose }) => {
  return <SocialShareModal data={data} onClose={onClose} />;
};
