import { VibeLineLogo } from '@vibeline/ui';

type AuthLoadingScreenProps = {
  title?: string;
  description?: string;
};

export const AuthLoadingScreen = ({
  title = 'VibeLine',
  description = 'Loading your workspace...'
}: AuthLoadingScreenProps) => (
  <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
    <div className="relative">
      <div className="absolute inset-0 animate-ping rounded-2xl bg-gradient-to-br from-blue-500/30 to-indigo-600/30" />
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-500/20 to-indigo-600/20 blur-xl" />
      <VibeLineLogo size="lg" className="relative" />
    </div>

    <h1 className="mt-6 text-xl font-bold text-slate-900">{title}</h1>
    <div className="mt-4 flex gap-1">
      <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.3s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-indigo-500 [animation-delay:-0.15s]" />
      <span className="h-2 w-2 animate-bounce rounded-full bg-violet-500" />
    </div>
    <p className="mt-3 text-sm text-slate-500">{description}</p>
  </main>
);
