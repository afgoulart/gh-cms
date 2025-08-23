'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { ContentFile, PullRequest } from '@/lib/github';

interface Post extends ContentFile {
  title?: string;
  createdAt?: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<number | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchPullRequests();
  }, []);

  const fetchPosts = async () => {
    try {
      // Busca posts da pasta /posts na branch principal
      const mainResponse = await fetch('/api/contents?path=posts&branch=main');
      const mainData = await mainResponse.json();
      
      // Busca posts de todas as branches
      const branchesResponse = await fetch('/api/branches');
      const branches = await branchesResponse.json();
      
      let allPosts: Post[] = [];
      
      // Adiciona posts da main (pasta /posts)
      if (Array.isArray(mainData)) {
        const mainPosts = mainData
          .filter((item: ContentFile) => item.type === 'file' && item.name.endsWith('.md'))
          .map((item: ContentFile) => ({
            ...item,
            title: extractTitle(item.name),
          }));
        allPosts.push(...mainPosts);
      }
      
      // Busca posts de outras branches (drafts/rascunhos)
      for (const branch of branches) {
        if (branch.name === 'main') continue;
        
        try {
          // Tenta buscar na pasta /posts primeiro
          let branchResponse = await fetch(`/api/contents?path=posts&branch=${branch.name}`);
          let branchData = await branchResponse.json();
          
          // Se não encontrou a pasta posts, busca na raiz da branch
          if (!Array.isArray(branchData) || branchData.length === 0) {
            branchResponse = await fetch(`/api/contents?path=&branch=${branch.name}`);
            branchData = await branchResponse.json();
          }
          
          if (Array.isArray(branchData)) {
            const branchPosts = branchData
              .filter((item: ContentFile) => item.type === 'file' && item.name.endsWith('.md'))
              .map((item: ContentFile) => ({
                ...item,
                title: extractTitle(item.name),
              }));
            allPosts.push(...branchPosts);
            
            if (branchPosts.length > 0) {
              console.log(`Encontrados ${branchPosts.length} posts em draft na branch ${branch.name}`);
            }
          }
        } catch (error) {
          console.log(`Erro ao buscar posts da branch ${branch.name}:`, error);
        }
      }
      
      setPosts(allPosts);
    } catch (error) {
      console.error('Erro ao carregar posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPullRequests = async () => {
    try {
      const response = await fetch('/api/pull-requests');
      const data = await response.json();
      setPullRequests(data);
    } catch (error) {
      console.error('Erro ao carregar pull requests:', error);
    }
  };

  const extractTitle = (filename: string): string => {
    return filename
      .replace('.md', '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getPostStatus = (post: Post) => {
    if (post.published) {
      return { label: 'Publicado', color: 'status-published' };
    }
    
    const hasPR = pullRequests.find(pr => pr.head.ref === post.branch);
    if (hasPR) {
      return { label: 'Aguardando Publicação', color: 'status-pending' };
    }
    
    return { label: 'Rascunho', color: 'status-draft' };
  };

  const handleEdit = (post: Post) => {
    window.location.href = `/posts/edit/${encodeURIComponent(post.path)}?branch=${post.branch}`;
  };

  const handleDelete = async (post: Post) => {
    if (!confirm(`Tem certeza que deseja excluir "${post.title}"?`)) {
      return;
    }

    setDeleting(post.path);
    try {
      const response = await fetch('/api/files', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          path: post.path,
          sha: post.sha,
          message: `Excluir post: ${post.title}`,
          branch: post.branch,
        }),
      });

      if (response.ok) {
        await fetchPosts();
        await fetchPullRequests();
      } else {
        alert('Erro ao excluir post');
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir post');
    } finally {
      setDeleting(null);
    }
  };

  const handlePublish = async (post: Post) => {
    const pr = pullRequests.find(pr => pr.head.ref === post.branch);
    if (!pr) {
      alert('Pull request não encontrado');
      return;
    }

    if (!confirm(`Tem certeza que deseja publicar "${post.title}"?`)) {
      return;
    }

    setPublishing(pr.number);
    try {
      const response = await fetch(`/api/pull-requests/${pr.number}/merge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commitTitle: `Publicar: ${post.title}`,
        }),
      });

      if (response.ok) {
        // Deletar branch após merge
        await fetch('/api/branches', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ branchName: post.branch }),
        });
        
        await fetchPosts();
        await fetchPullRequests();
        alert('Post publicado com sucesso!');
      } else {
        alert('Erro ao publicar post');
      }
    } catch (error) {
      console.error('Erro ao publicar:', error);
      alert('Erro ao publicar post');
    } finally {
      setPublishing(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Carregando posts...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-primary">Posts</h1>
          <a
            href="/posts/new"
            className="bg-secondary text-white px-4 py-2 rounded-lg hover:bg-blue-medium-light flex items-center space-x-2 transition-colors duration-250"
          >
            <span>➕</span>
            <span>Novo Post</span>
          </a>
        </div>

        {posts.length === 0 ? (
          <div className="bg-card rounded-lg border border-primary p-8 text-center">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-lg font-medium mb-2 text-primary">Nenhum post encontrado</h3>
            <p className="text-secondary mb-4">
              Comece criando seu primeiro post
            </p>
            <a
              href="/posts/new"
              className="bg-secondary text-white px-6 py-3 rounded-lg hover:bg-blue-medium-light transition-colors duration-250"
            >
              Criar Primeiro Post
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-primary overflow-hidden">
            <table className="min-w-full divide-y divide-primary">
              <thead className="bg-table-header">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Nome do Arquivo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-secondary uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-primary">
                {posts.map((post) => {
                  const status = getPostStatus(post);
                  const pr = pullRequests.find(pr => pr.head.ref === post.branch);
                  
                  return (
                    <tr key={`${post.branch}-${post.path}`} className="hover:bg-card/30 transition-colors duration-250">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary">
                        {post.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                        {post.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="text-secondary hover:text-primary transition-colors duration-250"
                        >
                          ✏️ Editar
                        </button>
                        
                        {!post.published && pr && (
                          <button
                            onClick={() => handlePublish(post)}
                            disabled={publishing === pr.number}
                            className="text-accent hover:text-secondary disabled:opacity-50 transition-colors duration-250"
                          >
                            {publishing === pr.number ? '⏳' : '🚀'} Publicar
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(post)}
                          disabled={deleting === post.path}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {deleting === post.path ? '⏳' : '🗑️'} Excluir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}