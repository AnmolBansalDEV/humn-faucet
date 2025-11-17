'use client';

import { FaucetStep } from './faucet-container';

interface ProcessingStepsProps {
  currentStep: FaucetStep;
  state: any;
}

const steps: Array<{ id: FaucetStep; label: string; description: string }> = [
  { id: 'wallet', label: 'Connect Wallet', description: 'Select your wallet' },
  { id: 'x-verify', label: 'Verify X', description: 'Verify your account' },
  { id: 'claim', label: 'Claim Tokens', description: 'Submit claim' },
  { id: 'success', label: 'Complete', description: 'All done!' },
];

export default function ProcessingSteps({ currentStep }: ProcessingStepsProps) {
  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isError = currentStep === 'error';

          return (
            <div key={step.id} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition ${
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent && !isError
                      ? 'bg-accent text-accent-foreground ring-2 ring-accent/50'
                      : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition ${
                      isCompleted ? 'bg-primary' : 'bg-secondary'
                    }`}
                  />
                )}
              </div>
              <p className="text-xs font-semibold mt-2 text-center text-foreground hidden sm:block">
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
