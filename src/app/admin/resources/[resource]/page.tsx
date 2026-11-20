import { notFound } from 'next/navigation';
import ResourceManager from '@/components/admin/ResourceManager';
import { RESOURCES } from '@/lib/admin/resources';

export async function generateMetadata({ params }: { params: Promise<{ resource: string }> }) {
  return { title: RESOURCES[(await params).resource]?.title ?? 'Admin' };
}

export default async function ResourcePage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = await params;
  if (!RESOURCES[resource]) notFound();
  return <ResourceManager key={resource} resource={resource} />;
}
