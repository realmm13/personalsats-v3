'use client'

import React from 'react'
import { EncryptionProvider } from '@/context/EncryptionContext'
import PassphraseModal from '@/components/PassphraseModal'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { PassphraseProvider, usePassphrase } from '@/lib/passphraseContext'

export default function ClientGate({ children }: { children: React.ReactNode }) {
  const { user } = useCurrentUser();

  // If not authenticated, skip encryption and just render login UI
  if (!user) {
    return <>{children}</>;
  }
  // Only once authenticated do we enter encryption context
  return (
    <EncryptionProvider>
      <PassphraseProvider>
        <PassphraseGate>{children}</PassphraseGate>
      </PassphraseProvider>
    </EncryptionProvider>
  );
}

function PassphraseGate({ children }: { children: React.ReactNode }) {
  const { isUnlocked } = usePassphrase();
  if (!isUnlocked) {
    return <PassphraseModal />;
  }
  return <>{children}</>;
} 