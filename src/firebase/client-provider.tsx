
'use client';

import React, { useMemo } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from './init';

export const FirebaseClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const firebaseConfig = useMemo(() => {
    // This runs only on the client because of 'use client' and useMemo
    return initializeFirebase();
  }, []);

  return (
    <FirebaseProvider {...firebaseConfig}>
      {children}
    </FirebaseProvider>
  );
};
