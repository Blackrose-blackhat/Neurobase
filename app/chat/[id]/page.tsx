'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { getProject } from '@/lib/db';
import DatabaseChat from '@/components/chat/DatabaseChat';

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProject() {
      try {
        const data = await getProject(id);
        setProject(data);
      } catch (error) {
        console.error('Failed to load project:', error);
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!project) {
    return <div>Project not found</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">{project.name}</h1>
      <DatabaseChat
        dbUrl={project.dbUrl}
        schema={project.schema}
        provider={project.provider}
        model={project.model }
        llmApiKey={project.llmApiKey}
        projectId={id}
        dbType={project.dbType}
      />
    </div>
  );
}