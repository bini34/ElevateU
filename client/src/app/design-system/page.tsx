import { notFound } from 'next/navigation';

export const metadata = { title: 'ElevateU design studio', robots: { index: false, follow: false } };

export default async function DesignSystemPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  const { DesignShowcase } = await import('@/components/design-system/DesignShowcase');
  return <DesignShowcase />;
}
