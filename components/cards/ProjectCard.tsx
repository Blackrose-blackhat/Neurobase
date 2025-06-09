"use client";

import React, { useState } from "react";
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
  Calendar,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
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
import { motion } from "framer-motion";
import { Dialog, DialogHeader , DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";

// Database type icons mapping
const DB_ICONS = {
  mongodb: "/images/db-icons/mongodb.svg",
  postgresql: "/images/db-icons/postgresql.svg",
  mysql: "/images/db-icons/mysql.svg",
  sqlite: "/images/db-icons/sqlite.svg",
  default: "/images/db-icons/database.svg",
};

// LLM provider icons mapping
const LLM_ICONS = {
  openai: "/images/llm-icons/openai.svg",
  anthropic: "/images/llm-icons/anthropic.svg",
  gemini: "/images/llm-icons/gemini.svg",
  default: "/images/llm-icons/ai.svg",
};

const getDatabaseType = (url: string): string => {
  if (url.includes("mongodb")) return "mongodb";
  if (url.includes("postgresql") || url.includes("postgres")) return "postgresql";
  if (url.includes("mysql")) return "mysql";
  if (url.includes("sqlite")) return "sqlite";
  return "default";
};

const getLLMProvider = (apiKey: string): string => {
  if (apiKey.startsWith("sk-")) return "openai";
  if (apiKey.startsWith("claude-")) return "anthropic";
  if (apiKey.startsWith("gemini-")) return "gemini";
  return "default";
};

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
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const formattedDate = new Date(project.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const truncatedDbUrl =
    project.dbUrl.length > 30
      ? `${project.dbUrl.substring(0, 30)}...`
      : project.dbUrl;

  const dbType = getDatabaseType(project.dbUrl);
  const llmProvider = project.llmApiKey ? getLLMProvider(project.llmApiKey) : null;
  console.log(llmProvider);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="group relative overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-all duration-300">
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Card Header */}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-semibold tracking-tight">
                {project.name}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="font-normal flex items-center gap-1">
                  <Image 
                    src={DB_ICONS[dbType]} 
                    alt={dbType} 
                    width={14} 
                    height={14} 
                    className="rounded-sm"
                  />
                  {dbType.charAt(0).toUpperCase() + dbType.slice(1)}
                </Badge>
                
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        {/* Card Content */}
        <CardContent className="pb-2">
          <div className="space-y-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <Image 
                src={DB_ICONS[dbType]} 
                alt={dbType} 
                width={16} 
                height={16} 
                className="mr-2 flex-shrink-0"
              />
              <span className="truncate" title={project.dbUrl}>
                {truncatedDbUrl}
              </span>
            </div>

            
            <div className="flex items-center text-xs text-muted-foreground">
              <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
              <span>Created {formattedDate}</span>
            </div>
          </div>
        </CardContent>

        {/* Card Footer */}
        <CardFooter className="pt-2">
          <Button 
            asChild 
            variant="ghost" 
            className="w-full justify-between group-hover:bg-primary/10 z-10"
          >
            <Link href={`/chat/${project.id}`}>
              <span className="flex items-center">
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Project
              </span>
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
        </CardFooter>

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Project</DialogTitle>
              <DialogDescription>
                Update your project configuration
              </DialogDescription>
            </DialogHeader>
            <ConfigureProjectForm 
              onClose={() => {
                setEditDialogOpen(false);
                onUpdate();
              }} 
              project={project}
            />
          </DialogContent>
        </Dialog>

        {/* Delete Dialog */}
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
    </motion.div>
  );
};

export default ProjectCard;
