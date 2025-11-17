'use client';

import { useState, useEffect } from 'react';

interface ZkProofGenerationProps {
  eligibilityToken: string | null;
  onProofGenerated: (proof: string, nullifier: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function ZkProofGeneration({
  eligibilityToken,
  onProofGenerated,
  isLoading,
  setIsLoading,
}: ZkProofGenerationProps) {
  const [step, setStep] = useState<'hashing' | 'proving' | 'complete'>('hashing');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setIsLoading(true);
    
    // Step 1: Hash nullifier (0-30%)
    const timer1 = setTimeout(() => {
      setProgress(30);
    }, 600);

    const timer2 = setTimeout(() => {
      setStep('proving');
      setProgress(50);
    }, 1000);

    // Step 2: Generate ZK proof (30-90%)
    const timer3 = setTimeout(() => {
      setProgress(90);
    }, 2500);

    const timer4 = setTimeout(() => {
      setStep('complete');
      setProgress(100);
      
      // Generate mock proof and nullifier
      const mockNullifier = 'null_' + Math.random().toString(36).substring(2, 15);
      const mockProof = 'proof_' + Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
      
      onProofGenerated(mockProof, mockNullifier);
      setIsLoading(false);
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [eligibilityToken, onProofGenerated, setIsLoading]);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className={`mt-1 rounded-full flex-shrink-0 ${step !== 'hashing' ? 'bg-primary' : 'bg-primary/30'} p-2`}>
            {step !== 'hashing' ? (
              <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Computing Nullifier Hash</p>
            <p className="text-xs text-muted-foreground">Unique commitment for Sybil resistance</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className={`mt-1 rounded-full flex-shrink-0 ${step === 'complete' ? 'bg-primary' : step === 'proving' ? 'bg-primary/30' : 'bg-muted'} p-2`}>
            {step === 'complete' ? (
              <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : step === 'proving' ? (
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            ) : (
              <div className="w-4 h-4 border-2 border-muted rounded-full" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Generating ZK Proof</p>
            <p className="text-xs text-muted-foreground">Proving eligibility without revealing identity</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step === 'complete' && (
        <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
          <p className="text-xs text-muted-foreground">
            ZK proof generated successfully. Ready to submit claim...
          </p>
        </div>
      )}
    </div>
  );
}
