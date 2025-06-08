"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MoreVertical,
  Edit,
  Trash2,
  Database,
  Calendar,
  ExternalLink,
  Key,
} from "lucide-react";
import ConfigureProjectForm from "@/components/forms/configureProject";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

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

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onDelete,
  onUpdate,
}) => {
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Format the date to be more readable
  const formattedDate = new Date(project.createdAt).toLocaleDateString(
    "en-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  );

  // Truncate DB URL for display
  const truncatedDbUrl =
    project.dbUrl.length > 30
      ? `${project.dbUrl.substring(0, 30)}...`
      : project.dbUrl;

  return (
    <Card className="relative group transition-all hover:shadow-md border-l-4 border-l-primary/70 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg font-semibold">
              {project.name}
            </CardTitle>
            <Badge variant="outline" className="w-fit text-xs">
              Project ID: {project.id.substring(0, 8)}
            </Badge>
          </div>

          <DropdownMenu >
            <DropdownMenuTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 z-10"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical size={16} />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              
             
              <DropdownMenuItem
                onClick={() => setDeleteDialogOpen(true)}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Delete project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pt-2">
        <div className="space-y-3">
          <div className="flex items-center text-sm text-muted-foreground">
            <Database size={14} className="mr-2 flex-shrink-0" />
            <span className="truncate" title={project.dbUrl}>
              {truncatedDbUrl}
            </span>
          </div>

          {project.llmApiKey && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Key size={14} className="mr-2 flex-shrink-0" />
              <span>API Key configured</span>
            </div>
          )}

          <div className="flex items-center text-xs text-muted-foreground">
            <Calendar size={14} className="mr-2 flex-shrink-0" />
            <span>Created on {formattedDate}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-4 z-10">
        <Button asChild variant="outline" className="w-full justify-start">
          <Link
            href={`/chat/${project.id}`}
            className="flex items-center w-full"
          >
            <ExternalLink size={14} className="mr-2" />
            Open Project
          </Link>
        </Button>
      </CardFooter>

      {/* Edit Modal */}
      

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete{" "}
              <span className="font-semibold">{project.name}</span>? This action
              cannot be undone and all associated data will be permanently
              removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
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
