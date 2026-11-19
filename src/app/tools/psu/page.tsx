import { PsuClient } from '@/features/psu/components/PsuClient';

export default async function PsuPage({
  searchParams,
}: {
  searchParams: Promise<{ cpu?: string; gpu?: string }>;
}) {
  const { cpu, gpu } = await searchParams;
  return (
    <PsuClient
      cpu={typeof cpu === 'string' ? cpu : undefined}
      gpu={typeof gpu === 'string' ? gpu : undefined}
    />
  );
}
