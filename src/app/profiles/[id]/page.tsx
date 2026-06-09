import ProfileDetailClient from './ProfileDetailClient';

export async function generateStaticParams() {
  // In a matrimonial app where profiles are created dynamically, we return an empty array 
  // to satisfy the static build requirement. The actual profile data is fetched 
  // client-side in the ProfileDetailClient component.
  return [];
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  return <ProfileDetailClient id={id} />;
}
