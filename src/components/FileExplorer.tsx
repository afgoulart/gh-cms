'use client';

import { useState, useEffect } from 'react';
import { ContentFile, FileVersion } from '@/lib/github';
import FileVersions from './FileVersions';

interface FileExplorerProps {
  currentPath: string;
  onPathChange: (path: string) => void;
  onFileVersionSelect: (file: ContentFile, version: FileVersion) => void;
  onNewFile: () => void;
}

export default function FileExplorer({ 
  currentPath, 
  onPathChange, 
  onFileVersionSelect, 
  onNewFile 
}: FileExplorerProps) {
  const [contents, setContents] = useState<ContentFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<ContentFile | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<FileVersion | null>(null);

  useEffect(() => {
    fetchContents();
  }, [currentPath]);

  const fetchContents = async () => {
    setLoading(true);
    try {
      // Build the path ensuring it starts with 'content'
      let searchPath = currentPath;
      if (!searchPath.startsWith('content')) {
        searchPath = searchPath ? `content/${searchPath}` : 'content';
      }

      // Get files from main branch by default, but show all versions when file is selected
      const response = await fetch(`/api/contents?path=${encodeURIComponent(searchPath)}&branch=main`);
      const mainData = await response.json();
      
      // Also get files from all branches to show a complete picture
      const branchesResponse = await fetch('/api/branches');
      const branches = await branchesResponse.json();
      
      let allFiles: ContentFile[] = [];
      const fileMap = new Map<string, ContentFile>();
      
      // Add files from main branch first
      if (Array.isArray(mainData)) {
        mainData.forEach((item: ContentFile) => {
          // Only show files that are within the content folder
          if (item.path.startsWith('content/')) {
            if (item.type === 'file') {
              item.published = true;
              item.branch = 'main';
            }
            fileMap.set(item.path, item);
          }
        });
      }
      
      // Then add draft files from other branches
      for (const branch of branches) {
        if (branch.name === 'main') continue;
        
        try {
          const branchResponse = await fetch(`/api/contents?path=${encodeURIComponent(searchPath)}&branch=${branch.name}`);
          const branchData = await branchResponse.json();
          
          if (Array.isArray(branchData)) {
            branchData.forEach((item: ContentFile) => {
              // Only show files that are within the content folder
              if (item.path.startsWith('content/')) {
                if (item.type === 'file') {
                  // Only add if we don't already have this file from main branch
                  if (!fileMap.has(item.path)) {
                    item.published = false;
                    item.branch = branch.name;
                    fileMap.set(item.path, item);
                  }
                } else {
                  // For directories, always add from main to avoid duplicates
                  if (!fileMap.has(item.path) && branch.name === 'main') {
                    fileMap.set(item.path, item);
                  }
                }
              }
            });
          }
        } catch (error) {
          // Branch might not have this path, skip silently
          console.log(`Path ${searchPath} not found in branch ${branch.name}`);
        }
      }
      
      setContents(Array.from(fileMap.values()));
    } catch (error) {
      console.error('Erro ao carregar conteúdos:', error);
      // If content folder doesn't exist, show empty state
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleItemClick = (item: ContentFile) => {
    if (item.type === 'dir') {
      onPathChange(item.path);
      setSelectedFile(null);
      setSelectedVersion(null);
    } else {
      setSelectedFile(item);
      setSelectedVersion(null);
    }
  };

  const handleVersionSelect = (version: FileVersion) => {
    if (selectedFile) {
      setSelectedVersion(version);
      // Create a file object with the version content
      const fileWithVersion: ContentFile = {
        ...selectedFile,
        content: version.content,
        sha: version.sha,
        branch: version.branch,
        published: version.isPublished,
      };
      onFileVersionSelect(fileWithVersion, version);
    }
  };

  const navigateUp = () => {
    const pathParts = currentPath.split('/');
    pathParts.pop();
    const newPath = pathParts.join('/');
    
    // Don't allow navigating above the content folder
    if (newPath === '' || !newPath.startsWith('content')) {
      onPathChange('content');
    } else {
      onPathChange(newPath);
    }
    setSelectedFile(null);
    setSelectedVersion(null);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-primary p-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-secondary">Carregando arquivos...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Browser */}
      <div className="bg-white rounded-lg border border-primary p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-primary">Explorador de Arquivos</h2>
          <button
            onClick={onNewFile}
            className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-blue-medium-light transition-colors duration-250"
          >
            ➕ Novo Arquivo
          </button>
        </div>

        {/* Breadcrumb */}
        <div className="mb-4 flex items-center space-x-2">
          <button
            onClick={() => {
              onPathChange('content');
              setSelectedFile(null);
            }}
            className="text-secondary hover:text-primary transition-colors duration-250"
          >
            📁 Content
          </button>
          {currentPath && currentPath !== 'content' && (
            <>
              <span className="text-secondary/50">/</span>
              {currentPath.replace('content/', '').split('/').filter(part => part).map((part, index, array) => (
                <div key={index} className="flex items-center">
                  <button
                    onClick={() => {
                      const newPath = 'content/' + array.slice(0, index + 1).join('/');
                      onPathChange(newPath);
                      setSelectedFile(null);
                    }}
                    className="text-secondary hover:text-primary transition-colors duration-250"
                  >
                    {part}
                  </button>
                  {index < array.length - 1 && <span className="text-secondary/50 ml-2">/</span>}
                </div>
              ))}
            </>
          )}
        </div>

        {/* Back button */}
        {currentPath && currentPath !== 'content' && (
          <button
            onClick={navigateUp}
            className="mb-4 text-secondary hover:text-primary flex items-center transition-colors duration-250"
          >
            ← Voltar
          </button>
        )}

        {/* File List */}
        <div className="space-y-2">
          {contents.map((item) => (
            <div
              key={item.path}
              onClick={() => handleItemClick(item)}
              className={`flex items-center p-3 border border-secondary rounded-lg cursor-pointer hover:bg-card/30 transition-colors duration-250 ${
                selectedFile?.path === item.path ? 'bg-card/50 border-accent' : ''
              }`}
            >
              <span className="mr-3">
                {item.type === 'dir' ? '📁' : '📄'}
              </span>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-primary">{item.name}</span>
                  {item.type === 'file' && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${
                      item.published ? 'status-published' : 'status-draft'
                    }`}>
                      {item.published ? '✅ Publicado' : '📝 Rascunho'}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-secondary">
                {item.type === 'dir' ? 'Pasta' : 'Arquivo'}
              </span>
            </div>
          ))}
        </div>

        {contents.length === 0 && (
          <div className="text-center py-8 text-secondary">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="text-lg font-medium mb-2 text-primary">Pasta vazia</h3>
            <p className="text-sm">
              Nenhum arquivo encontrado nesta pasta
            </p>
          </div>
        )}
      </div>

      {/* File Versions */}
      {selectedFile && selectedFile.type === 'file' && (
        <FileVersions
          filePath={selectedFile.path}
          onVersionSelect={handleVersionSelect}
          selectedVersion={selectedVersion}
        />
      )}
    </div>
  );
}