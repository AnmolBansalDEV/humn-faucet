'use client';

import { useState, useEffect } from 'react';

interface OprfRequestProps {
  xUserId: string | null;
  onComplete: (token: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function OprfRequest({
  xUserId,
  onComplete,
  isLoading,
  setIsLoading,
}: OprfRequestProps) {
  const [step, setStep] = useState<'requesting' | 'received'>('requesting');

  useEffect(() => {
    setIsLoading(true);
    // Simulate OPRF server request
    const timer1 = setTimeout(() => {
      setStep('received');
    }, 1500);

    const timer2 = setTimeout(() => {
      // Mock OPRF output
      const mockToken = 'oprf_' + Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
      onComplete(mockToken);
      setIsLoading(false);
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [xUserId, onComplete, setIsLoading]);

  return (
    <div className="space-y-4">
      <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
        <p className="text-sm text-muted-foreground">X User ID</p>
        <p className="text-sm font-mono text-accent">{xUserId}</p>
      </div>

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={`mt-1 rounded-full flex-shrink-0 ${step === 'received' ? 'bg-primary' : 'bg-primary/30'} p-2`}>
            <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Requesting OPRF Eligibility Token</p>
            <p className="text-xs text-muted-foreground">From Human Network OPRF Server</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className={`mt-1 rounded-full flex-shrink-0 ${step === 'received' ? 'bg-primary' : 'bg-muted'} p-2`}>
            {step === 'received' ? (
              <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="animate-spin w-4 h-4 border-2 border-muted-foreground border-t-foreground rounded-full" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Received Eligibility Token</p>
            <p className="text-xs text-muted-foreground">Privacy maintained - no linkage to X handle</p>
          </div>
        </div>
      </div>

      {step === 'received' && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
          <p className="text-xs text-muted-foreground mb-1">Token generated successfully. Proceeding to ZK proof generation...</p>
        </div>
      )}
    </div>
  );
}
