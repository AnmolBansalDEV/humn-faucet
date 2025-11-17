'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import WalletConnect from './wallet-connect';
import XVerification from './x-verification';
import ClaimSubmission from './claim-submission';
import { CheckCircle2, Lock, Zap } from 'lucide-react';
import { request_from_signer } from "@holonym-foundation/mishtiwasm"
import { hashToHex, initializeHumanNetwork, SIGNER_URL } from '@/lib/utils';
import Link from 'next/link';

export type FaucetStep = 'wallet' | 'x-verify' | 'claim' | 'success' | 'error';

interface FaucetState {
    walletAddress: string | null;
    xHandle: string | null;
    xUserId: string | null;
    nullifier: string | null;
    txHash: string | null;
    error: string | null;
}

export default function FaucetContainer() {
    const [step, setStep] = useState<FaucetStep>('wallet');
    const [state, setState] = useState<FaucetState>({
        walletAddress: null,
        xHandle: null,
        xUserId: null,
        nullifier: null,
        txHash: null,
        error: null,
    });
    const [isLoading, setIsLoading] = useState(false);

    const handleWalletConnect = (address: string) => {
        setState(prev => ({ ...prev, walletAddress: address }));
        setStep('x-verify');
    };

    const handleXVerification = async (handle: string, userId: string) => {
        setIsLoading(true);
        await initializeHumanNetwork();
        if (!SIGNER_URL) {
            alert('SIGNER_URL is not defined');
            setIsLoading(false);
            return;
        }
        const eligibilityToken = await request_from_signer(
            userId,
            'OPRFSecp256k1',
            SIGNER_URL,
        );
        console.log('Received eligibility token:', eligibilityToken);
        const NULLIFIER_DOMAIN_SCOPE = 'test-humn-faucet-claim-v1';

        // Combine the secret token and the public scope
        const preImage = eligibilityToken + NULLIFIER_DOMAIN_SCOPE;

        // Convert the string to a buffer for hashing
        const encoder = new TextEncoder();
        const data = encoder.encode(preImage);

        // Step 3: Hash it using SHA-256
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);

        // Convert the hash buffer to our final hex string
        const nullifier = await hashToHex(hashBuffer);
        console.log('Computed nullifier:', nullifier);

        setState(prev => ({
            ...prev,
            xHandle: handle,
            xUserId: userId,
            nullifier: nullifier,
        }));
        setIsLoading(false);
        setStep('claim');

    };

    const handleClaimSuccess = (txHash: string) => {
        console.log('Claim successful with txHash:', txHash);
        setState(prev => ({ ...prev, txHash }));
        setStep('success');
    };

    const handleError = (error: string) => {
        setState(prev => ({ ...prev, error }));
        setStep('error');
    };

    const handleReset = () => {
        setState({
            walletAddress: null,
            xHandle: null,
            xUserId: null,
            nullifier: null,
            txHash: null,
            error: null,
        });
        setStep('wallet');
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 relative z-10">
            <div className="w-full max-w-3xl">
                <div className="text-center mb-12 md:mb-16 slide-in">
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="w-3 h-3 rounded-full bg-primary" />
                        <span className="text-xs font-medium tracking-wide uppercase text-muted-foreground">Human Network</span>
                        <div className="w-3 h-3 rounded-full bg-accent" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 text-balance leading-tight">
                        Claim TEST HUMN Tokens
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-xl mx-auto text-pretty">
                        Verify your identity anonymously with zero-knowledge proofs. One claim per X account, no blockchain traces.
                    </p>
                </div>

                <Card className="border border-border/40 bg-card/50 backdrop-blur-xl shadow-2xl mb-8 slide-in overflow-hidden">
                    {/* Progress steps */}
                    <div className="bg-gradient-to-r from-primary/5 via-accent/5 to-transparent border-b border-border/30 p-6 md:p-8">
                        <div className="flex items-center justify-between max-w-sm mx-auto">
                            {[
                                { num: 1, label: 'Connect Wallet', active: ['wallet', 'x-verify', 'claim', 'success'].includes(step) },
                                { num: 2, label: 'Verify X', active: ['x-verify', 'claim', 'success'].includes(step) },
                                { num: 3, label: 'Claim', active: ['claim', 'success'].includes(step) },
                            ].map((item, idx) => (
                                <div key={item.num} className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${item.active
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-secondary text-muted-foreground'
                                        }`}>
                                        {item.num}
                                    </div>
                                    {idx < 2 && <div className={`w-12 h-1 rounded-full transition-all ${item.active ? 'bg-primary' : 'bg-secondary'}`} />}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 md:p-8">
                        {step === 'wallet' && (
                            <WalletConnect onConnect={handleWalletConnect} />
                        )}

                        {step === 'x-verify' && (
                            <XVerification
                                onVerified={handleXVerification}
                                walletAddress={state.walletAddress}
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                            />
                        )}

                        {step === 'claim' && (
                            <ClaimSubmission
                                walletAddress={state.walletAddress}
                                nullifier={state.nullifier}
                                onSuccess={handleClaimSuccess}
                                onError={handleError}
                                isLoading={isLoading}
                                setIsLoading={setIsLoading}
                            />
                        )}

                        {step === 'success' && (
                            <div className="text-center space-y-6 py-8 scale-up">
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-linear-to-br from-primary/30 to-accent/30 flex items-center justify-center glow-pulse">
                                        <CheckCircle2 className="w-12 h-12 text-primary" />
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-foreground mb-2">Claim Successful!</h3>
                                    <p className="text-muted-foreground mb-6">
                                        You have successfully claimed 100 HUMN tokens to your wallet. Your claim is anonymous and verified on-chain.
                                    </p>
                                    <div className="bg-secondary/40 border border-border/40 rounded-lg p-4 mb-6">
                                        <p className="text-xs text-muted-foreground mb-2">Transaction Hash</p>
                                        <Link target='_blank' href={`https://sepolia.etherscan.io/tx/${state.txHash}`}>
                                        <p className="text-sm font-mono break-all underline">{state.txHash}</p>
                                        </Link>
                                    </div>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="px-8 py-3 bg-linear-to-r from-primary to-primary/80 text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-primary/30 transition font-semibold"
                                >
                                    Start New Claim
                                </button>
                            </div>
                        )}

                        {step === 'error' && (
                            <div className="text-center space-y-6 py-8 scale-up">
                                <div className="flex justify-center">
                                    <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center">
                                        <svg className="w-12 h-12 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-foreground mb-2">Something Went Wrong</h3>
                                    <p className="text-muted-foreground">{state.error}</p>
                                </div>
                                <button
                                    onClick={handleReset}
                                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:shadow-lg hover:shadow-primary/30 transition font-semibold"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 slide-in">
                    <Card className="bg-card/40 border border-border/30 hover:border-primary/50 hover:bg-card/60 transition group p-6">
                        <div className="flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center transition">
                                <Lock className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-1">Privacy First</h3>
                                <p className="text-sm text-muted-foreground">No on-chain or off-chain link between your X account and wallet</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-card/40 border border-border/30 hover:border-accent/50 hover:bg-card/60 transition group p-6">
                        <div className="flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-lg bg-accent/20 group-hover:bg-accent/30 flex items-center justify-center transition">
                                <CheckCircle2 className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-1">Sybil Resistant</h3>
                                <p className="text-sm text-muted-foreground">One claim per verified X account via zero-knowledge nullifier</p>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-card/40 border border-border/30 hover:border-primary/50 hover:bg-card/60 transition group p-6">
                        <div className="flex flex-col gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/20 group-hover:bg-primary/30 flex items-center justify-center transition">
                                <Zap className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground mb-1">Zero Knowledge</h3>
                                <p className="text-sm text-muted-foreground">Prove eligibility without revealing your identity or X handle</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
