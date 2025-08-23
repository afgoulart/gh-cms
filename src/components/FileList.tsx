"use client";

import { useEffect, useState } from "react";

import { ContentFile } from "@/lib/github";

interface FileListProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  onFileSelect: (file: ContentFile) => void;
  onNewFile: () => void;
  selectedBranch?: string;
  onBranchChange?: (branch: string) => void;
}

export default function FileList({
  currentPath,
  onPathChange,
  onFileSelect,
  onNewFile,
  selectedBranch,
  onBranchChange,
}: FileListProps) {
  const [contents, setContents] = useState<ContentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [branches, setBranches] = useState<string[]>([]);

  useEffect(() => {
    fetchContents();
    fetchBranches();
  }, [currentPath, selectedBranch]);

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/branches");
      const data = await response.json();
      setBranches(data.map((b: any) => b.name));
    } catch (error) {
      console.error("Erro ao carregar branches:", error);
    }
  };

  const fetchContents = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/contents?path=${encodeURIComponent(currentPath)}&branch=${encodeURIComponent(selectedBranch || "")}`,
      );
      const data = await response.json();
      setContents(data);
    } catch (error) {
      console.error("Erro ao carregar conteúdos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: ContentFile) => {
    if (item.type === "dir") {
      onPathChange(item.path);
    } else {
      onFileSelect(item);
    }
  };

  const navigateUp = () => {
    const pathParts = currentPath.split("/");
    pathParts.pop();
    onPathChange(pathParts.join("/"));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 border border-primary rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-semibold text-primary text-xl">Arquivos</h2>
        <div className="flex items-center space-x-2">
          {onBranchChange && branches.length > 0 && (
            <select
              value={selectedBranch}
              onChange={(e) => onBranchChange(e.target.value)}
              className="px-3 py-1 border border-secondary focus:border-accent rounded focus:ring-2 focus:ring-accent text-sm transition-colors duration-250"
            >
              {branches.map((branch) => (
                <option key={branch} value={branch}>
                  {branch === "main" ? "🌐 main (publicado)" : `📝 ${branch}`}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={onNewFile}
            className="bg-secondary hover:bg-blue-medium-light px-4 py-2 rounded-lg text-white transition-colors duration-250"
          >
            Novo Arquivo
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <button
          onClick={() => onPathChange("")}
          className="text-secondary hover:text-primary transition-colors duration-250"
        >
          Raiz
        </button>
        {currentPath && (
          <>
            <span className="text-secondary/50">/</span>
            {currentPath.split("/").map((part, index, array) => (
              <div key={index} className="flex items-center">
                <button
                  onClick={() => onPathChange(array.slice(0, index + 1).join("/"))}
                  className="text-secondary hover:text-primary transition-colors duration-250"
                >
                  {part}
                </button>
                {index < array.length - 1 && <span className="ml-2 text-secondary/50">/</span>}
              </div>
            ))}
          </>
        )}
      </div>

      {currentPath && (
        <button
          onClick={navigateUp}
          className="flex items-center mb-4 text-secondary hover:text-primary transition-colors duration-250"
        >
          ← Voltar
        </button>
      )}

      <div className="space-y-2">
        {contents.map((item) => (
          <div
            key={item.path}
            onClick={() => handleItemClick(item)}
            className="flex items-center hover:bg-card/30 p-3 border border-secondary rounded-lg transition-colors duration-250 cursor-pointer"
          >
            <span className="mr-3">{item.type === "dir" ? "📁" : "📄"}</span>
            <div className="flex-1">
              <span className="text-primary">{item.name}</span>
              {item.type === "file" && item.branch && item.branch !== "main" && (
                <span className="inline-flex items-center ml-2 px-2 py-1 rounded-full text-xs status-draft">
                  📝 Rascunho
                </span>
              )}
              {item.type === "file" && item.published && (
                <span className="inline-flex items-center ml-2 px-2 py-1 rounded-full text-xs status-published">
                  ✅ Publicado
                </span>
              )}
            </div>
            <span className="text-secondary text-sm">{item.type === "dir" ? "Pasta" : "Arquivo"}</span>
          </div>
        ))}
      </div>

      {contents.length === 0 && <div className="py-8 text-secondary text-center">Nenhum arquivo encontrado</div>}
    </div>
  );
}
