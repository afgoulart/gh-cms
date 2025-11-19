'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import { titleToSlug, slugToFilename } from '@/utils/slug';

// Import the markdown editor dynamically to avoid SSR issues
const MDEditor = dynamic(() => import('@uiw/react-md-editor'), {
  ssr: false,
  loading: () => <div className="h-96 bg-gray-100 rounded flex items-center justify-center">Carregando editor...</div>
});

export default function NewPostPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [slug, setSlug] = useState('');
  const [editorMode, setEditorMode] = useState<'markdown' | 'html'>('markdown');

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle);
    setSlug(titleToSlug(newTitle));
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
      const filename = slugToFilename(slug);
      const filePath = `content/${filename}`; // Salvar na pasta /content
      const postContent = `# ${title}\n\n${content}`;
      const commitMessage = `Novo post: ${title}`;

      const response = await fetch('/api/files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: filePath,
          content: postContent,
          message: commitMessage,
          isNewFile: true,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.pullRequest) {
          alert(
            `Post criado com sucesso!\\n\\n` +
            `Branch: ${result.branch}\\n` +
            `Pull Request: #${result.pullRequest.number}\\n\\n` +
            `O post foi criado em uma branch separada e está aguardando publicação.`
          );
        } else {
          alert('Post criado com sucesso!');
        }
        
        router.push('/posts');
      } else {
        const error = await response.json();
        alert(`Erro ao criar post: ${error.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao criar post');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (title || content) {
      if (confirm('Tem certeza que deseja cancelar? As alterações não salvas serão perdidas.')) {
        router.push('/posts');
      }
    } else {
      router.push('/posts');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Novo Post</h1>
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setEditorMode('markdown')}
                className={`px-3 py-1 rounded-md text-sm transition-colors duration-250 ${
                  editorMode === 'markdown'
                    ? 'bg-secondary text-white'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                📝 Markdown
              </button>
              <button
                onClick={() => setEditorMode('html')}
                className={`px-3 py-1 rounded-md text-sm transition-colors duration-250 ${
                  editorMode === 'html'
                    ? 'bg-secondary text-white'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                🖼️ Visual
              </button>
            </div>
            <button
              onClick={handleCancel}
              className="px-4 py-2 border border-secondary text-secondary rounded-lg hover:bg-mint-light transition-colors duration-250"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !title.trim()}
              className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-blue-medium-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-250"
            >
              {saving ? '⏳ Salvando...' : '💾 Criar Post'}
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
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full p-3 border border-secondary rounded-lg focus:ring-2 focus:ring-accent focus:border-accent transition-colors duration-250"
              placeholder="Digite o título do post..."
              disabled={saving}
            />
            {slug && (
              <p className="text-sm text-secondary mt-2">
                <strong>Arquivo:</strong> content/{slugToFilename(slug)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">
              Conteúdo
            </label>
            {editorMode === 'html' ? (
              <div className="border border-secondary rounded-lg overflow-hidden">
                <MDEditor
                  value={content}
                  onChange={(val) => setContent(val || '')}
                  height={400}
                  preview="edit"
                  visibleDragBar={false}
                  data-color-mode="light"
                />
              </div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-96 p-3 border border-secondary rounded-lg focus:ring-2 focus:ring-accent focus:border-accent font-mono text-sm transition-colors duration-250"
                placeholder="Digite o conteúdo do post em Markdown..."
                disabled={saving}
              />
            )}
            <p className="text-sm text-secondary mt-2">
              {editorMode === 'html'
                ? '🖼️ Editor visual com suporte a Markdown e HTML'
                : '💡 Você pode usar Markdown para formatação do texto'
              }
            </p>
          </div>

          <div className="bg-mint-light border border-accent rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="text-accent text-lg">ℹ️</div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-primary">
                  Como funciona?
                </h3>
                <p className="mt-1 text-sm text-secondary">
                  Novos posts são criados em uma branch separada e ficam como rascunho. 
                  Após criar, você poderá publicá-lo na página de Posts fazendo o merge para a branch principal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}