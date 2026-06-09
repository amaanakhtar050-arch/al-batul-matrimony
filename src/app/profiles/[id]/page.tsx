import ProfileDetailClient from './ProfileDetailClient';

/**
 * generateStaticParams is required for dynamic routes during static export.
 * Returning an empty array allows the build to complete while allowing 
 * the client-side router to handle the route at runtime in a SPA-like fashion.
 */
export async function generateStaticParams() {
  return [];
}

/**
 * The ProfilePage component for Al Batul Matrimony.
 * In Next.js 15, params are provided as a Promise.
 */
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  return <ProfileDetailClient id={id} />;
}
