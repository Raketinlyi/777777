'use client';

import type React from 'react';

import { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';

// Initialize Stripe with a public key
// In a real app, this would come from environment variables
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
);

interface StripeProps {
  children: React.ReactNode;
  options: {
    mode: 'payment' | 'subscription';
    amount: number;
    currency: string;
  };
  className?: string;
}

export function Stripe({ children, options, className }: StripeProps) {
  const [clientSecret, setClientSecret] = useState('');

  useEffect(() => {
    // In a real implementation, this would be a call to your backend
    // to create a payment intent and return the client secret
    // For demo purposes, we're just simulating this
    const simulatePaymentIntent = () => {
      // Simulate API response delay
      setTimeout(() => {
        // In production, this should come from your backend API
        // setClientSecret("demo_client_secret_" + Math.random().toString(36).substring(2, 15))
      }, 1000);
    };

    simulatePaymentIntent();
  }, [options.amount, options.currency]);

  return (
    <div className={className}>
      {clientSecret ? (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: 'night',
              variables: {
                colorPrimary: '#0ea5e9',
                colorBackground: '#0f172a',
                colorText: '#f8fafc',
                colorDanger: '#ef4444',
                fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
                borderRadius: '8px',
              },
            },
          }}
        >
          {children}
        </Elements>
      ) : (
        <div className='flex items-center justify-center p-8'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500'></div>
        </div>
      )}
    </div>
  );
}
