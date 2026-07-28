'use client';

import React from 'react';
import { SetupWizardModal } from '@/presentation/components/business/SetupWizardModal';

interface CredentialManagerModalProps {
  onClose: () => void;
}

export const CredentialManagerModal: React.FC<CredentialManagerModalProps> = ({ onClose }) => {
  return <SetupWizardModal onClose={onClose} onComplete={onClose} />;
};
