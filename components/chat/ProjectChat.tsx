"use client"
import { useEffect, useMemo, useState } from 'react';
import { getProject } from '@/lib/db';
import DatabaseChat from '@/components/chat/DatabaseChat';
import { Loader, LoaderPinwheel } from 'lucide-react';
import { Spinner } from '../ui/ios-spinner';

export default function ProjectChat({ id }: { id: string }) {
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

  const stableSchema = useMemo(() => {
    return JSON.stringify(project?.schema || {});
  }, [project?.schema]);

  const parsedSchema = useMemo(() => {
    try {
      return JSON.parse(stableSchema);
    } catch {
      return {};
    }
  }, [stableSchema]);

  if (loading) return <div className='container mx-auto p-4 h-screen flex flex-col items-center'><Spinner size="lg" /></div>;
  if (!project) return <div>Project not found</div>;

  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
        <p className="text-muted-foreground mt-1">
          Database chat interface for {project.dbType} • {project.provider} {project.model}
        </p>
      </div>
      <DatabaseChat
        dbUrl={project.dbUrl}
        schema={parsedSchema}
        provider={project.provider}
        model={project.model}
        llmApiKey={project.llmApiKey}
        projectId={id}
        dbType={project.dbType}
      />
    </div>
  );
}
