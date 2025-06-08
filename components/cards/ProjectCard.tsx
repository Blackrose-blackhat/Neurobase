import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MoreVertical } from "lucide-react";
import ConfigureProjectForm from "@/components/forms/configureProject";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";

interface ProjectCardProps {
  project: {
    name: string;
    id: string;
    dbUrl: string;
    createdAt: string;
    llmApiKey?: string;
    config: any;
  };
  onDelete: (id: string) => void;
  onUpdate: () => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onDelete, onUpdate }) => {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <Card className="relative group cursor-pointer transition-shadow hover:shadow-lg">
      <div
        className="absolute inset-0 z-0"
        onClick={() => router.push(`/chat/${project.id}`)}
        aria-label="Open chat"
      />
      <CardHeader className="flex flex-row items-start justify-between z-10 relative">
        <CardTitle className="text-lg">{project.name}</CardTitle>
        <div className="relative">
          {/* Settings Dialog */}
          <AlertDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <AlertDialogTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                onClick={e => {
                  e.stopPropagation();
                  setSettingsOpen(true);
                }}
              >
                <MoreVertical size={18} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent onClick={e => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Project Settings</AlertDialogTitle>
                <AlertDialogDescription>
                  Edit or delete this project.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="flex flex-col gap-2 py-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditOpen(true);
                    setSettingsOpen(false);
                  }}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setDeleteDialogOpen(true);
                    setSettingsOpen(false);
                  }}
                >
                  Delete
                </Button>
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Close</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 z-10 relative">
        <div className="text-sm text-gray-600 break-all">
          DB URL: {project.dbUrl}
        </div>
        <div className="text-xs text-gray-400">
          Created: {project.createdAt}
        </div>
      </CardContent>
      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[350px]">
            <ConfigureProjectForm
              initialData={project}
              onClose={() => {
                setEditOpen(false);
                onUpdate();
              }}
            />
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent onClick={e => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <b>{project.name}</b>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => {
                onDelete(project.id);
                setDeleteDialogOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};

export default ProjectCard;