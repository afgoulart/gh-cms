"use client";

import { useEffect, useState } from "react";

import FileEditor from "@/components/FileEditor";
import FileExplorer from "@/components/FileExplorer";
import Layout from "@/components/Layout";
import PublishManager from "@/components/PublishManager";
import { ContentFile, FileVersion } from "@/lib/github";

export default function Home() {
  const [currentPath, setCurrentPath] = useState("posts"); // Iniciar na pasta posts
  const [selectedFile, setSelectedFile] = useState<ContentFile | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<FileVersion | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFileVersionSelect = (file: ContentFile, version: FileVersion) => {
    setSelectedFile(file);
    setSelectedVersion(version);
    setIsEditing(true);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };


  const handleSave = async (path: string, content: string, message: string, isNewFile?: boolean) => {
    try {
      const response = await fetch("/api/files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path,
          content,
          message,
          sha: selectedFile?.sha,
          branch: isNewFile ? undefined : selectedFile?.branch,
          isNewFile,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        handleRefresh();
        return result;
      }
      return { success: false };
    } catch (error) {
      console.error("Erro ao salvar:", error);
      return { success: false };
    }
  };

  const handleDelete = async (file: ContentFile) => {
    try {
      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          path: file.path,
          sha: file.sha,
          message: `Excluir ${file.name}`,
          branch: file.branch || "main",
        }),
      });

      if (response.ok) {
        setIsEditing(false);
        setSelectedFile(null);
        handleRefresh();
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
    }
  };

  const handleNewFile = () => {
    setSelectedFile(null);
    setSelectedVersion(null);
    setIsCreating(true);
    setIsEditing(true);
  };

  const handleClose = () => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedFile(null);
    setSelectedVersion(null);
    handleRefresh();
  };

  return (
    <Layout>
      <div className="mx-auto">
        <div className="mb-8">
          <h1 className="mb-2 font-bold text-primary text-2xl">Gerenciador de Posts</h1>
          <p className="text-secondary">Explore e gerencie todos os posts do seu repositório GitHub</p>
        </div>
        <div className="flex flex-row gap-8">
          <div>
            <FileExplorer
              key={refreshKey}
              currentPath={currentPath}
              onPathChange={setCurrentPath}
              onFileVersionSelect={handleFileVersionSelect}
              onNewFile={handleNewFile}
            />
          </div>

          <div>
            {isEditing ? (
              <FileEditor 
                file={selectedFile} 
                onSave={handleSave} 
                onClose={handleClose} 
                onDelete={handleDelete}
                selectedVersion={selectedVersion}
              />
            ) : (
              <div className="bg-white p-6 border border-primary rounded-lg">
                <div className="py-12 text-secondary text-center">
                  <div className="mb-4 text-4xl">📝</div>
                  <h3 className="mb-2 font-medium text-primary text-lg">Selecione um arquivo para editar</h3>
                  <p className="text-sm">Ou crie um novo arquivo usando o botão "Novo Arquivo"</p>
                </div>
              </div>
            )}
          </div>
          {/* 
          <div className="lg:col-span-2 xl:col-span-1">
            <PublishManager key={refreshKey} onRefresh={handleRefresh} />
          </div> */}
        </div>
      </div>
    </Layout>
  );
}
