'use client';

// ID for web-model3 - now taken from environment variables
export const WEB_MODEL3_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'crazycube-project-id';

// Simple function to get model data
export async function getWebModel3Data() {
  try {
    // Implementation will be added when bridge is ready
    return { status: 'coming-soon' };
  } catch (error) {
    return { status: 'error' };
  }
}

// Utilities for working with model ID
export function validateWebModel3Id(id: string): boolean {
  return id.length > 0;
}

// WebModel3 utilities object
export const webModel3Utils = {
  formatModelId: (id: string): string => {
    if (!id) return 'Not configured';
    return id.length > 20 ? `${id.substring(0, 20)}...` : id;
  },

  isValidModelId: (id: string): boolean => {
    return typeof id === 'string' && id.length > 0;
  },

  isConfigured: (): boolean => {
    const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'crazycube-project-id';
    return projectId ? projectId.length > 0 : false;
  },
};
