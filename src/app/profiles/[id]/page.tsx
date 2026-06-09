import ProfileDetailClient from './ProfileDetailClient';

export async function generateStaticParams() { return []; }

export default async function Page({ params, }: { params: Promise<{ id: string }>; }) { const resolvedParams = await params; const id = resolvedParams.id;

return <ProfileDetailClient id={id} />; }