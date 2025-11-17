'use client';

// 1. Import CheckCircle2 for completed steps and Loader2 for pending
import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { CheckCircle2, Loader2, Zap } from 'lucide-react'; // Added Loader2
import { API_BASE_URL } from '@/lib/utils';

interface ClaimSubmissionProps {
  walletAddress: string | null;
  nullifier: string | null;
  onSuccess: (txHash: string) => void;
  onError: (error: string) => void;
  isLoading: boolean; // We still use this prop to show the parent it's loading
  setIsLoading: (loading: boolean) => void;
}

export default function ClaimSubmission({
  walletAddress,
  nullifier,
  onSuccess,
  onError,
  setIsLoading,
}: ClaimSubmissionProps) {
  const hasSubmitted = useRef(false);
  // 2. We've removed the 'step' and 'progress' states.
  // This component's only job is to process,
  // and the parent will unmount it on success/error.

  useEffect(() => {
    // 3. Define an async function to call the backend
    const submitClaim = async () => {
      setIsLoading(true);

      try {
        // 4. Make the API call to your backend
        const response = await fetch(`${API_BASE_URL}/api/claim`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            walletAddress,
            nullifier,
          }),
        });

        // 5. Handle errors from the backend (like "Already Claimed")
        if (!response.ok) {
          const errorData = await response.json();
          // This will be caught by the catch block
          throw new Error(errorData.message || 'Failed to submit claim.');
        }

        // 6. Handle success
        const successData = await response.json();
        onSuccess(successData.txHash); // Pass the real txHash to the parent
        
      } catch (error) {
        // 7. Handle any network or thrown errors
        console.error('Claim submission error:', error);
        onError(error instanceof Error ? error.message : String(error));
      } finally {
        // 8. Let the parent know loading is done
        // (onSuccess/onError will typically unmount this,
        // but this is good practice just in case)
        setIsLoading(false);
      }
    };

    // 9. Run the submission function when the component mounts
    if (walletAddress && nullifier) {
      if (hasSubmitted.current) return;
      hasSubmitted.current = true;
      submitClaim();
    } else {
      onError('Missing required claim data.');
    }

    // We only want this to run once, and the cleanup is implicit.
    // The props are guaranteed, but linting prefers them.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 10. The JSX is simplified. We removed the 'step' checks
  // and the fake progress bar.
  return (
    <div className="space-y-6 fade-in">
      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-foreground">
            Processing Your Claim
          </h2>
          <p className="text-muted-foreground text-sm">
            Verifying your anonymous proof and broadcasting the transaction...
          </p>
        </div>

        {/* This "Processing details" card is now our
            primary progress indicator */}
        <Card className="bg-secondary/40 border border-border/40 p-4 space-y-3">
          {/* Step 1: Complete */}
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-muted-foreground">
                OPRF Eligibility Token generated securely
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Human Network → Your Device
              </p>
            </div>
          </div>
          
          {/* Step 2: Complete */}
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-muted-foreground">
                Nullifier computed locally with zero-knowledge proof
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Client-side Processing
              </p>
            </div>
          </div>
          
          {/* Step 3: In Progress */}
          <div className="flex items-start gap-3">
            <Loader2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5 animate-spin" />
            <div className="text-sm">
              <p className="text-muted-foreground">
                Broadcasting to blockchain
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Awaiting confirmation...
              </p>
            </div>
          </div>
        </Card>

        {/* Claim details card remains the same */}
        <Card className="bg-linear-to-r from-secondary/50 to-secondary/30 border border-border/40 p-4">
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">To:</span>
              <span className="text-sm font-mono text-accent font-semibold">
                {walletAddress?.slice(0, 10)}...{walletAddress?.slice(-8)}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Amount:</span>
              <span className="text-sm font-semibold text-foreground">
                100 HUMN
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Privacy:</span>
              <span className="text-sm font-semibold text-primary">
                Anonymous ✓
              </span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}