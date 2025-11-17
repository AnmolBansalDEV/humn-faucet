'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useConnect, useAccount } from 'wagmi';

interface WalletConnectProps {
    onConnect: (address: string) => void;
}

const walletDetails: Record<string, { name: string; gradient: string }> = {
    metaMaskSDK: {
        name: 'MetaMask',
        gradient: 'from-orange-500 to-yellow-500',
    },
    injected: {
        name: 'Browser Wallet',
        gradient: 'from-blue-600 to-blue-400',
    },
    walletConnect: {
        name: 'WalletConnect',
        gradient: 'from-blue-500 to-cyan-500',
    },
    coinbaseWallet: {
        name: 'Coinbase Wallet',
        gradient: 'from-blue-600 to-blue-400',
    },
};

export default function WalletConnect({ onConnect }: WalletConnectProps) {
    const { connect, connectors, isPending, error } = useConnect();
    const { address, isConnected } = useAccount();
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // This effect listens for a successful connection
    // and then calls your onConnect prop.
    useEffect(() => {
        if (isConnected && address) {
            onConnect(address);
        }
    }, [isConnected, address, onConnect]);

    useEffect(() => {
        // Clear error when a new connection starts
        if (isPending) {
            setErrorMessage(null);
        }

        // Set a user-friendly error message if connection fails
        if (error) {
            // "User rejected" is a common and specific error
            if (error.message.includes('User rejected')) {
                setErrorMessage('Connection request rejected.');
            } else {
                // Generic fallback error
                setErrorMessage('Failed to connect wallet.');
            }
            // Log the full error for debugging
            console.error('Wallet connection error:', error);
        }
    }, [error, isPending]);
    // Filter out connectors that are not ready
    // or that we don't have UI details for.
    const availableConnectors = connectors.filter(
        (c) => walletDetails[c.id]
    );
    console.log('Available connectors:', availableConnectors);
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                    Connect Your Wallet
                </h2>
                <p className="text-muted-foreground">
                    Select a wallet to get started with your anonymous claim
                </p>
                {/* 5. Render the error message if it exists */}
                {errorMessage && (
                    <p className="text-sm font-medium text-red-500 mt-2">
                        {errorMessage}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
                {availableConnectors.map((connector) => {
                    // No need to check if details exists, it's guaranteed by the filter
                    const details = walletDetails[connector.id];
                    const isConnecting = isPending; // You might want to check pendingConnector.id
                    if (!details) {
                        return null;
                    }
                    return (
                        <button
                            key={connector.id} // This key is valid and now the only one
                            onClick={() => connect({ connector })}
                            disabled={isPending} // Disable all buttons while one is connecting
                            className="relative h-32 group overflow-hidden"
                        >
                            <Card className="w-full h-full border border-border/40 bg-gradient-to-br from-card via-card to-secondary/30 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all group-hover:scale-105 duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed">
                                <div className="flex flex-col items-center gap-3">
                                    <div
                                        className={`w-12 h-12 rounded-full bg-gradient-to-br ${details.gradient} flex items-center justify-center`}
                                    >
                                        {isConnecting ? (
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                            // Using your original SVG icon
                                            <svg
                                                className="w-6 h-6 text-white"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M17.938 5.172A2 2 0 0016 3H4a2 2 0 00-1.938 2.172V9a2 2 0 100 4v2.172a2 2 0 001.938 2.172h12a2 2 0 001.938-2.172V9a2 2 0 100-4V5.172zM5 9a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="text-sm font-semibold text-foreground">
                                        {details.name}
                                    </div>
                                </div>
                            </Card>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}