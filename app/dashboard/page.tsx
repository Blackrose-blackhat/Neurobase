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
import { Plus, Database, Settings, Github } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/images/icon.png"
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
    <div className="min-h-screen bg-gradient-to-b from-background to-background/80 w-full ">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-full ">
        <div className=" flex h-16 items-center justify-between px-4 w-full ">
          <Link href="/" className="flex items-center gap-2">
            <Image src={logo} height={35} width={35} />
            <h1 className="text-xl font-semibold">DB GPT</h1>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <a href="https://github.com/Blackrose-blackhat/DB-GPT" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5" />
              </a>
            </Button>
            
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button 
                  variant="default" 
                  disabled={!isDBInitialized}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" /> 
                  New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Configure New Project</DialogTitle>
                  <DialogDescription>
                    Connect your database and setup your LLM provider
                  </DialogDescription>
                </DialogHeader>
                <ConfigureProjectForm onClose={handleClose} />
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-2">Welcome to DB GPT</h2>
          <p className="text-muted-foreground">
            Manage your AI-powered database projects and start chatting with your data
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-full flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/50"
            >
              <Database className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Projects Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to start chatting with your database
              </p>
              <Button 
                variant="default" 
                onClick={() => setOpen(true)}
                disabled={!isDBInitialized}
                className="gap-2"
              >
                <Plus className="h-4 w-4" /> 
                Create Project
              </Button>
            </motion.div>
          ) : (
            projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProjectCard
                  project={project}
                  onDelete={handleDelete}
                  onUpdate={fetchProjects}
                />
              </motion.div>
            ))
          )}
        </div>
      </main>

      {/* Footer */}
      {/* <footer className="border-t border-border/40 mt-auto">
        <div className=" flex h-14 items-center justify-between px-4">
          <p className="text-sm text-muted-foreground">
            © 2024 DB GPT. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Button variant="link" size="sm" asChild>
              <a href="/docs">Documentation</a>
            </Button>
            <Button variant="link" size="sm" asChild>
              <a href="/privacy">Privacy</a>
            </Button>
          </div>
        </div>
      </footer> */}
    </div>
  );
};

export default Page;
