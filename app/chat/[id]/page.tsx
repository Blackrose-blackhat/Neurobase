// app/chat/[id]/page.tsx
import { use } from 'react';
import ProjectChat from '@/components/chat/ProjectChat';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ProjectChat id={id} />;
}