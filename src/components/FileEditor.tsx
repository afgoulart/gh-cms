"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

import { ContentFile, FileVersion } from "@/lib/github";

// Import the markdown editor dynamically to avoid SSR issues
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <div className="flex justify-center items-center bg-gray-100 rounded h-96">Carregando editor...</div>,
});

interface FileEditorProps {
  file: ContentFile | null;
  onSave: (path: string, content: string, message: string, isNewFile?: boolean) => Promise<any>;
  onClose: () => void;
  onDelete?: (file: ContentFile) => void;
  selectedVersion?: FileVersion | null;
}

export default function FileEditor({ file, onSave, onClose, onDelete, selectedVersion }: FileEditorProps) {
  const [content, setContent] = useState("");
  const [commitMessage, setCommitMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [isNewFile, setIsNewFile] = useState(false);
  const [fileName, setFileName] = useState("");
  const [saveResult, setSaveResult] = useState<any>(null);
  const [editorMode, setEditorMode] = useState<"markdown" | "html">("html");

  useEffect(() => {
    if (file) {
      setContent(file.content || "");
      setFileName(file.name);
      setIsNewFile(false);
      setCommitMessage(`Atualizar ${file.name}`);
    } else {
      setContent("");
      setFileName("");
      setIsNewFile(true);
      setCommitMessage("Criar novo arquivo");
    }
  }, [file]);

  const handleSave = async () => {
    if (!fileName.trim()) {
      alert("Nome do arquivo é obrigatório");
      return;
    }

    if (!commitMessage.trim()) {
      alert("Mensagem de commit é obrigatória");
      return;
    }

    setSaving(true);
    try {
      const filePath = isNewFile ? fileName : file!.path;
      const result = await onSave(filePath, content, commitMessage, isNewFile);

      if (result && (result.success || result === true)) {
        setSaveResult(result);
        if (isNewFile && result.pullRequest) {
          alert(
            `Arquivo criado com sucesso!\n\nUma nova branch foi criada: ${result.branch}\nPull Request criado para publicação: #${result.pullRequest.number}`,
          );
        } else {
          alert("Arquivo salvo com sucesso!");
        }
        onClose();
      } else {
        alert("Erro ao salvar arquivo");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      alert("Erro ao salvar arquivo");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (file && onDelete) {
      if (confirm(`Tem certeza que deseja excluir ${file.name}?`)) {
        onDelete(file);
      }
    }
  };

  return (
    <div className="bg-white p-6 border border-primary rounded-lg" style={{ minWidth: "800px" }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-semibold text-primary text-xl">
            {isNewFile ? "Novo Arquivo" : `Editando: ${file?.name}`}
          </h2>
          {file && file.branch && file.branch !== "main" && (
            <div className="mt-1 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full status-draft">
                📝 Rascunho em: {file.branch}
              </span>
            </div>
          )}
          {file && file.published && (
            <div className="mt-1 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full status-published">✅ Publicado</span>
            </div>
          )}
          {selectedVersion && (
            <div className="mt-1 text-sm">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-accent text-navy">
                🔍 Visualizando versão: {selectedVersion.branch} 
                <span className="ml-1 font-mono">#{selectedVersion.sha.substring(0, 7)}</span>
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setEditorMode("markdown")}
              className={`px-3 py-1 rounded-md text-sm transition-colors duration-250 ${
                editorMode === "markdown" ? "bg-secondary text-white" : "text-secondary hover:text-primary"
              }`}
            >
              📝 Markdown
            </button>
            <button
              onClick={() => setEditorMode("html")}
              className={`px-3 py-1 rounded-md text-sm transition-colors duration-250 ${
                editorMode === "html" ? "bg-secondary text-white" : "text-secondary hover:text-primary"
              }`}
            >
              🖼️ Visual
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-secondary hover:text-primary text-xl transition-colors duration-250"
          >
            ×
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {isNewFile && (
          <div>
            <label className="block mb-2 font-medium text-primary text-sm">Nome do Arquivo</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="p-2 border border-secondary focus:border-accent rounded-lg focus:ring-2 focus:ring-accent w-full transition-colors duration-250"
              placeholder="exemplo.md"
            />
            <p className="mt-1 text-secondary text-sm">
              💡 Novos arquivos são criados em uma branch separada e precisam ser publicados
            </p>
          </div>
        )}

        <div>
          <label className="block mb-2 font-medium text-primary text-sm">Conteúdo</label>
          {editorMode === "html" ? (
            <div className="border border-secondary rounded-lg overflow-hidden">
              <MDEditor
                value={content}
                onChange={(val) => setContent(val || "")}
                height={400}
                preview="edit"
                visibleDragbar={false}
                data-color-mode="light"
              />
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="p-3 border border-secondary focus:border-accent rounded-lg focus:ring-2 focus:ring-accent w-full h-96 font-mono text-sm transition-colors duration-250"
              placeholder="Digite o conteúdo do arquivo em Markdown..."
            />
          )}
          <p className="mt-2 text-secondary text-sm">
            {editorMode === "html"
              ? "🖼️ Editor visual com suporte a Markdown e HTML"
              : "📝 Você pode usar Markdown para formatação do texto"}
          </p>
        </div>

        <div>
          <label className="block mb-2 font-medium text-primary text-sm">Mensagem de Commit</label>
          <input
            type="text"
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            className="p-2 border border-secondary focus:border-accent rounded-lg focus:ring-2 focus:ring-accent w-full transition-colors duration-250"
            placeholder="Descreva as alterações..."
          />
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-secondary hover:bg-blue-medium-light disabled:opacity-50 px-4 py-2 rounded-lg text-white transition-colors duration-250"
          >
            {saving ? "⏳ Salvando..." : isNewFile ? "💾 Criar Arquivo" : "💾 Salvar Alterações"}
          </button>

          {file && onDelete && (
            <button
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-white transition-colors duration-250"
            >
              🗑️ Excluir
            </button>
          )}

          <button
            onClick={onClose}
            className="hover:bg-mint-light px-4 py-2 border border-secondary rounded-lg text-secondary transition-colors duration-250"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
