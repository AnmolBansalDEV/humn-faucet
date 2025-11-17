'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface XVerificationProps {
    onVerified: (handle: string, userId: string) => void;
    walletAddress: string | null;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
}

export default function XVerification({
    onVerified,
    walletAddress,
    isLoading,
    setIsLoading,
}: XVerificationProps) {
    const [xHandle, setXHandle] = useState('');

    const handleManualVerify = () => {
        // Don't submit if empty
        if (!xHandle.trim()) {
            return;
        }

        setIsLoading(true);

        setTimeout(() => {
            const cleanedHandle = xHandle.trim().startsWith('@')
                ? xHandle.trim().substring(1)
                : xHandle.trim();

            const mockUserId = `mock_id_for_${cleanedHandle}`;

            onVerified(cleanedHandle, mockUserId);
            setIsLoading(false);
        }, 800);
    };

    return (
        <div className="space-y-6 fade-in">
            {/* This part remains the same */}
            <Card className="bg-gradient-to-r from-secondary/50 to-secondary/30 border border-border/40 p-4">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wide">
                    Connected Wallet
                </p>
                <p className="text-sm font-mono text-primary font-semibold">
                    {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
                </p>
            </Card>

            <div className="space-y-3">
                <h2 className="text-xl font-bold text-foreground">Verify Your X Account</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                    Connect your X (Twitter) account to verify your identity. This ensures
                    one claim per person while keeping your X handle completely private
                    from your wallet address.
                </p>
            </div>

            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="x-handle">X Handle</Label>
                    <p className="text-xs text-muted-foreground">
                        Since this is a demo, just type your handle. (We&lsquo;re on the honor
                        system here! 😉)
                    </p>
                    <Input
                        id="x-handle"
                        placeholder="@your_handle"
                        value={xHandle}
                        onChange={(e) => setXHandle(e.target.value)}
                        disabled={isLoading}
                        className="h-11 text-base"
                    />
                </div>

                <Button
                    onClick={handleManualVerify}
                    disabled={isLoading || !xHandle.trim()}
                    className="w-full h-12 text-base font-semibold hover:shadow-lg hover:shadow-accent/30 transition group"
                >
                    {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <>
                            <svg
                                className="w-5 h-5 mr-2 group-hover:rotate-12 transition"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                            >
                                <path d="M11.4 8.5h.8l3.9 5h2.6l-4.3-5 4-4.5h-2.6l-3.6 4h-.8V3.5H9.6V14h1.8V8.5z M4 3.5h2.5L11 14H8.3L4 3.5z" />
                            </svg>
                            Verify Handle
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}