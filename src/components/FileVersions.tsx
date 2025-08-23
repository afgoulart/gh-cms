'use client';

import { useState, useEffect } from 'react';
import { FileVersion } from '@/lib/github';

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
      console.error('Erro ao carregar versões:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const truncateMessage = (message: string, maxLength: number = 50) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-primary p-4">
        <div className="flex items-center justify-center py-4">
          <div className="text-secondary">Carregando versões...</div>
        </div>
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-primary p-4">
        <div className="text-center py-4 text-secondary">
          <div className="text-2xl mb-2">📄</div>
          <div>Nenhuma versão encontrada</div>
        </div>
      </div>
    );
  }

  // Show only first 3 versions if not expanded
  const displayVersions = expanded ? versions : versions.slice(0, 3);

  return (
    <div className="bg-white rounded-lg border border-primary">
      <div className="p-4 border-b border-secondary">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-primary">
            Versões do Arquivo
          </h3>
          <div className="text-sm text-secondary">
            {versions.length} versão{versions.length !== 1 ? 'es' : ''}
          </div>
        </div>
      </div>
      
      <div className="divide-y divide-secondary">
        {displayVersions.map((version, index) => (
          <div
            key={`${version.branch}-${version.sha}`}
            onClick={() => onVersionSelect(version)}
            className={`p-4 cursor-pointer hover:bg-card/30 transition-colors duration-250 ${
              selectedVersion?.sha === version.sha ? 'bg-card/50 border-l-4 border-l-accent' : ''
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${
                    version.isPublished ? 'status-published' : 'status-draft'
                  }`}>
                    {version.isPublished ? '✅ Publicado' : '📝 Rascunho'}
                  </span>
                  <span className="text-sm text-secondary">
                    em {version.branch}
                  </span>
                  {index === 0 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent text-navy">
                      🕐 Mais recente
                    </span>
                  )}
                </div>
                
                <p className="text-sm text-primary font-medium mb-1">
                  {truncateMessage(version.commitMessage)}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-secondary">
                  <span>👤 {version.author}</span>
                  <span>📅 {formatDate(version.lastModified)}</span>
                  <span className="font-mono">#{version.sha.substring(0, 7)}</span>
                </div>
              </div>
              
              <div className="ml-4 flex-shrink-0">
                {selectedVersion?.sha === version.sha && (
                  <div className="text-accent text-lg">
                    👁️
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {versions.length > 3 && (
        <div className="p-3 border-t border-secondary text-center">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-secondary hover:text-primary text-sm transition-colors duration-250"
          >
            {expanded ? '👆 Mostrar menos' : `👇 Mostrar mais ${versions.length - 3} versões`}
          </button>
        </div>
      )}
    </div>
  );
}