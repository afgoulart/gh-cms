'use client';

import { useState, useEffect } from 'react';
import { PullRequest } from '@/lib/github';

interface PublishManagerProps {
  onRefresh: () => void;
}

export default function PublishManager({ onRefresh }: PublishManagerProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [mergingPR, setMergingPR] = useState<number | null>(null);

  useEffect(() => {
    fetchPullRequests();
  }, []);

  const fetchPullRequests = async () => {
    try {
      const response = await fetch('/api/pull-requests');
      const data = await response.json();
      setPullRequests(data);
    } catch (error) {
      console.error('Erro ao carregar pull requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMerge = async (pullRequest: PullRequest) => {
    if (!confirm(`Tem certeza que deseja publicar "${pullRequest.title}"?`)) {
      return;
    }

    setMergingPR(pullRequest.number);
    try {
      const response = await fetch(`/api/pull-requests/${pullRequest.number}/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commitTitle: `Publicar: ${pullRequest.title}`,
        }),
      });

      if (response.ok) {
        await fetchPullRequests();
        await deleteBranch(pullRequest.head.ref);
        onRefresh();
        alert('Conteúdo publicado com sucesso!');
      } else {
        alert('Erro ao publicar conteúdo');
      }
    } catch (error) {
      console.error('Erro ao fazer merge:', error);
      alert('Erro ao publicar conteúdo');
    } finally {
      setMergingPR(null);
    }
  };

  const deleteBranch = async (branchName: string) => {
    try {
      await fetch('/api/branches', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ branchName }),
      });
    } catch (error) {
      console.error('Erro ao deletar branch:', error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Aguardando Publicação</h3>
        <div className="text-center py-4 text-gray-500">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Aguardando Publicação</h3>
        <button
          onClick={fetchPullRequests}
          className="text-blue-500 hover:text-blue-700"
        >
          🔄 Atualizar
        </button>
      </div>

      {pullRequests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-3xl mb-2">✅</div>
          <p>Nenhum conteúdo aguardando publicação</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pullRequests.map((pr) => (
            <div
              key={pr.number}
              className="border rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{pr.title}</h4>
                  <div className="text-sm text-gray-500 mt-1">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800 mr-2">
                      {pr.head.ref}
                    </span>
                    → main
                  </div>
                  <a
                    href={pr.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Ver no GitHub →
                  </a>
                </div>
                <button
                  onClick={() => handleMerge(pr)}
                  disabled={mergingPR === pr.number}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:opacity-50 text-sm"
                >
                  {mergingPR === pr.number ? 'Publicando...' : 'Publicar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}