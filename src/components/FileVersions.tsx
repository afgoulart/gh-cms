"use client";

import { useEffect, useState } from "react";

import { FileVersion } from "@/lib/github";

interface FileVersionsProps {
  filePath: string;
  onVersionSelect: (version: FileVersion) => void;
  selectedVersion?: FileVersion;
}

export default function FileVersions({ filePath, onVersionSelect, selectedVersion }: FileVersionsProps) {
  const [versions, setVersions] = useState<FileVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (filePath) {
      fetchVersions();
    }
  }, [filePath]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/file-versions?path=${encodeURIComponent(filePath)}`);
      const data = await response.json();
      setVersions(data);

      // Auto-select the published version if available, otherwise the first version
      if (data.length > 0 && !selectedVersion) {
        const publishedVersion = data.find((v: FileVersion) => v.isPublished) || data[0];
        onVersionSelect(publishedVersion);
      }
    } catch (error) {
      console.error("Erro ao carregar versões:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="bg-white p-4 border border-primary rounded-lg">
        <div className="flex justify-center items-center py-4">
          <div className="text-secondary">Carregando versões...</div>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="bg-white p-4 border border-primary rounded-lg">
        <div className="py-4 text-secondary text-center">
          <div className="mb-2 text-2xl">📄</div>
          <div>Nenhuma versão encontrada</div>
        </div>
      </div>
    );
  }

  // Show only first 3 versions if not expanded
  const displayVersions = expanded ? versions : versions.slice(0, 3);

  return (
    <div className="bg-white border border-primary rounded-lg">
      <div className="p-4 border-secondary border-b">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-primary text-lg">Versões do Arquivo</h3>
          <div className="text-secondary text-sm">
            {versions.length} versão{versions.length !== 1 ? "es" : ""}
          </div>
        </div>
      </div>

      <div className="divide-y divide-secondary">
        {displayVersions.map((version, index) => (
          <div
            key={`${version.branch}-${version.sha}`}
            onClick={() => onVersionSelect(version)}
            className={`p-4 cursor-pointer hover:bg-card/30 transition-colors duration-250 ${
              selectedVersion?.sha === version.sha ? "bg-card/50 border-l-4 border-l-accent" : ""
            }`}
          >
            <div className="flex justify-between items-start">
              <div className="flex flex-wrap flex-1 min-w-0">
                <div className="flex flex-row items-center space-x-2 mb-2">
                  <span
                    className={`inline-flex items-center whitespace-nowrap px-2 py-1 rounded-full text-xs font-semibold ${
                      version.isPublished ? "status-published" : "status-draft"
                    }`}
                  >
                    {version.isPublished ? "✅ Publicado" : "📝 Rascunho"}
                  </span>
                  {/* <span className="text-secondary text-sm">em {version.branch}</span> */}
                  {index === 0 && (
                    <span className="inline-flex items-center bg-accent px-2 py-1 rounded-full text-navy text-xs">
                      🕐 Mais recente
                    </span>
                  )}
                </div>

                <p className="mb-1 font-medium text-primary text-sm">{truncateMessage(version.commitMessage)}</p>

                <div className="flex items-center space-x-4 text-secondary text-xs">
                  <span>👤 {version.author}</span>
                  <span>📅 {formatDate(version.lastModified)}</span>
                  <span className="font-mono">#{version.sha.substring(0, 7)}</span>
                </div>
              </div>

              {/* <div className="flex-shrink-0 ml-4">
                {selectedVersion?.sha === version.sha && <div className="text-accent text-lg">👁️</div>}
              </div> */}
            </div>
          </div>
        ))}
      </div>

      {versions.length > 3 && (
        <div className="p-3 border-secondary border-t text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-secondary hover:text-primary text-sm transition-colors duration-250"
          >
            {expanded ? "👆 Mostrar menos" : `👇 Mostrar mais ${versions.length - 3} versões`}
          </button>
        </div>
      )}
    </div>
  );
}
