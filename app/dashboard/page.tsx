"use client";
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ConfigureProjectForm from "@/components/forms/configureProject";
import ProjectCard from "@/components/cards/ProjectCard";
// Import your getProject and DB logic
import { openDB } from "idb";
import type { ProjectData } from "@/types/dbConfig.types";
import { decryptData } from "@/lib/crypto"; // Import your decrypt function
import { SECRET_KEY } from "@/secret";
import { Plus } from "lucide-react";

const DB_NAME = "dbgpt";
const STORE_NAME = "projects";
const DB_VERSION = 1;

async function initDB() {
  const db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    },
  });
  return db;
}

async function getAllProjectsDecoded(): Promise<ProjectData[]> {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  const all = await store.getAll();
  await tx.done;

  // Decrypt sensitive fields
  return await Promise.all(
    all.map(async (project) => ({
      ...project,
      dbUrl: await decryptData(SECRET_KEY, project.dbUrl),
      llmApiKey: project.llmApiKey
        ? await decryptData(SECRET_KEY, project.llmApiKey)
        : undefined,
    }))
  );
}

const Page = () => {
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [isDBInitialized, setIsDBInitialized] = useState(false);

  const handleClose = () => {
    setOpen(false);
    fetchProjects(); // Refresh projects after closing dialog
  };

  const fetchProjects = async () => {
    const all = await getAllProjectsDecoded();
    setProjects(all);
  };

  const handleDelete = async (id: string) => {
    try {
      const db = await initDB();
      const tx = db.transaction(STORE_NAME, "readwrite");
      await tx.objectStore(STORE_NAME).delete(id);
      await tx.done;
      fetchProjects();
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        await initDB();
        setIsDBInitialized(true);
        await fetchProjects();
      } catch (error) {
        console.error("Error initializing database:", error);
      }
    };
    initialize();
  }, []);

  return (
    <div>
      <nav className="flex flex-row justify-between w-full p-4">
        <p className="text-lg font-semibold">DB GPT</p>
        <div className="flex flex-row gap-2">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="default" disabled={!isDBInitialized}>
                <Plus /> Add New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Configure Project</DialogTitle>
                <DialogDescription>
                  Connect your database and setup your LLM provider
                </DialogDescription>
              </DialogHeader>
              <ConfigureProjectForm onClose={handleClose} />
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onDelete={handleDelete}
            onUpdate={fetchProjects}
          />
        ))}
      </div>
    </div>
  );
};

export default Page;
