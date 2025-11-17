'use client';

import FaucetContainer from "@/components/faucet-container";


export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-background overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03]" />
        
        {/* Gradient orbs */}
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute top-0 left-1/2 w-[300px] h-[300px] bg-primary/3 rounded-full blur-2xl" />
      </div>
      
      <FaucetContainer />
    </main>
  );
}
