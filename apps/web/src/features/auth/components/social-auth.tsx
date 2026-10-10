'use client';

import { GoogleIcon } from '../assets/svg/social-links';
import { useAuthProviders } from '../hooks/use-auth-providers';
import { SocialLink } from './social-link';

export function SocialAuth({ apiBaseUrl }: { apiBaseUrl: string }) {
  const { google } = useAuthProviders();

  if (!google) return null;

  return (
    <div className="mb-0 mt-auto pt-16 md:pt-6">
      <div className="my-7 flex items-center gap-4">
        <span className="h-px flex-1 bg-border" />
        <span className="text-xs text-content-muted">or continue with</span>
        <span className="h-px flex-1 bg-border" />
      </div>

      <SocialLink href={`${apiBaseUrl}/auth/google`} label="Continue with Google" icon={<GoogleIcon />} />
    </div>
  );
}
