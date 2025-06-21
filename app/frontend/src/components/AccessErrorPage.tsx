// Server-compatible error page (no useEffect, no redirect)
import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AccessErrorPageProps {
  message: string;
}

/**
 * AccessErrorPage (Server-compatible)
 * Displays a full-page error state for access/authorization errors.
 * Use this in server components.
 */
const AccessErrorPage: React.FC<AccessErrorPageProps> = ({ message }) => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-base-100 px-4">
    <div className="flex flex-col items-center bg-white rounded-xl shadow-lg p-8 border border-red-200 max-w-md w-full">
      <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
      <h2 className="text-2xl font-bold text-red-700 mb-2">Accès refusé</h2>
      <p className="text-base text-gray-700 mb-4 text-center">{message}</p>
    </div>
  </div>
);

export default AccessErrorPage;

// Client-only redirect error page
// Place this in a client component if you need auto-redirect
export const AccessErrorRedirect: React.FC<AccessErrorPageProps & { redirectTo?: string; delayMs?: number }> = ({ message, redirectTo = '/', delayMs = 2500 }) => {
  'use client';
  React.useEffect(() => {
    const timer = setTimeout(() => {
      window.location.href = redirectTo;
    }, delayMs);
    return () => clearTimeout(timer);
  }, [redirectTo, delayMs]);

  return (
    <AccessErrorPage message={message} />
  );
};
