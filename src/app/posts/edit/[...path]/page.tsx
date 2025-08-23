'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { ContentFile } from '@/lib/github';

interface EditPostPageProps {
  params: Promise<{ path: string[] }>;
}

export default function EditPostPage({ params }: EditPostPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resolvedParams, setResolvedParams] = useState<{ path: string[] } | null>(null);
  const [file, setFile] = useState<ContentFile | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  useEffect(() => {
    if (resolvedParams) {
      fetchFile();
    }
  }, [resolvedParams]);

  const fetchFile = async () => {
    if (!resolvedParams) return;

    try {
      const filePath = resolvedParams.path.join('/');
      const branch = searchParams.get('branch') || undefined;
      
      const response = await fetch(`/api/files?path=${encodeURIComponent(filePath)}&branch=${encodeURIComponent(branch || '')}`);
      const fileData = await response.json();
      
      setFile(fileData);
      
      // Extrair título e conteúdo do markdown
      const fileContent = fileData.content || '';
      const lines = fileContent.split('\\n');
      
      let extractedTitle = '';
      let extractedContent = '';
      
      if (lines[0]?.startsWith('# ')) {
        extractedTitle = lines[0].replace('# ', '').trim();
        extractedContent = lines.slice(2).join('\\n').trim(); // Skip title and empty line
      } else {
        // Se não tem título no formato markdown, usa o nome do arquivo
        extractedTitle = fileData.name.replace('.md', '').replace(/-/g, ' ');
        extractedContent = fileContent;
      }
      
      setTitle(extractedTitle);
      setContent(extractedContent);
    } catch (error) {
      console.error('Erro ao carregar arquivo:', error);
      alert('Erro ao carregar arquivo');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Título é obrigatório');
      return;
    }

    if (!content.trim()) {
      alert('Conteúdo é obrigatório');
      return;
    }

    setSaving(true);
    try {
      const postContent = `# ${title}\\n\\n${content}`;
      const commitMessage = `Atualizar post: ${title}`;

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: file!.path,
          content: postContent,
          message: commitMessage,
          sha: file!.sha,
          branch: file!.branch,
        }),
      });

      if (response.ok) {
        alert('Post atualizado com sucesso!');
        router.push('/posts');
      } else {
        const error = await response.json();
        alert(`Erro ao atualizar post: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao atualizar post');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/posts');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando post...</div>
        </div>
      </Layout>
    );
  }

  if (!file) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="text-red-500 text-xl mb-4">❌</div>
          <h2 className="text-lg font-medium mb-2">Post não encontrado</h2>
          <button
            onClick={() => router.push('/posts')}
            className="text-blue-500 hover:underline"
          >
            Voltar para Posts
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">Editar Post</h1>
            <div className="flex items-center space-x-2 mt-2">
              <span className="text-sm text-secondary">Arquivo: {file.name}</span>
              {file.branch && file.branch !== 'main' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs status-draft">
                  📝 Rascunho em: {file.branch}
                </span>
              )}
              {file.published && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs status-published">
                  ✅ Publicado
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-secondary text-secondary rounded-lg hover:bg-mint-light transition-colors duration-250"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-medium-light disabled:opacity-50 transition-colors duration-250"
            >
              {saving ? '⏳ Salvando...' : '💾 Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-primary p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Título do Post
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-secondary rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-250"
              placeholder="Digite o título do post..."
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Conteúdo
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-96 p-3 border border-secondary rounded-lg focus:ring-2 focus:ring-accent focus:border-accent font-mono text-sm transition-colors duration-250"
              placeholder="Digite o conteúdo do post em Markdown..."
              disabled={saving}
            />
            <p className="text-sm text-secondary mt-2">
              💡 Você pode usar Markdown para formatação do texto
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}