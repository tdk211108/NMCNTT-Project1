import { VI_MESSAGES } from '@/shared/messages/vi';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">
        {VI_MESSAGES.brand.name}
      </h1>
      <p className="mt-2 text-slate-600">{VI_MESSAGES.brand.tagline}</p>
    </main>
  );
}
