"use client";

import { useEffect, useState } from "react";

import Layout from "@/components/Layout";
import { ContentFile, PullRequest } from "@/lib/github";

interface Post extends ContentFile {
  title?: string;
  createdAt?: string;
  contentVersions: Post[];
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
      // Busca posts da pasta /content na branch principal
      const mainResponse = await fetch("/api/contents?path=content&branch=main");
      const mainData = await mainResponse.json();

      // Busca posts de todas as branches
      const branchesResponse = await fetch("/api/branches");
      const branches = await branchesResponse.json();

      let allPosts: Post[] = [];

      // Adiciona posts da main (pasta /content)
      if (Array.isArray(mainData)) {
        const mainPosts = mainData
          .filter((item: ContentFile) => item.type === "file" && item.name.endsWith(".md") && item.path.startsWith("content/"))
          .map((item: ContentFile) => ({
            ...item,
            title: extractTitle(item.name),
            contentVersions: [],
          }));
        allPosts.push(...mainPosts);
      }

      // Busca posts de outras branches (drafts/rascunhos)
      for (const branch of branches) {
        if (branch.name === "main") continue;

        try {
          // Tenta buscar na pasta /content primeiro
          let branchResponse = await fetch(`/api/contents?path=content&branch=${branch.name}`);
          let branchData = await branchResponse.json();

          // Se não encontrou a pasta content, busca na raiz da branch
          if (!Array.isArray(branchData) || branchData.length === 0) {
            branchResponse = await fetch(`/api/contents?path=&branch=${branch.name}`);
            branchData = await branchResponse.json();
          }

          if (Array.isArray(branchData)) {
            const branchPosts = branchData
              .filter((item: ContentFile) => item.type === "file" && item.name.endsWith(".md") && item.path.startsWith("content/"))
              .map((item: ContentFile) => ({
                ...item,
                title: extractTitle(item.name),
                contentVersions: [],
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

      allPosts = allPosts.reduce((acc: Post[], post: Post) => {
        // Verifica se já existe um post com o mesmo caminho
        const existingPost = acc.find((p) => p.path === post.path);
        if (existingPost) {
          existingPost.contentVersions = existingPost.contentVersions
            ? existingPost.contentVersions.concat(post)
            : [post];
        } else {
          acc.push(post);
        }
        return acc;
      }, []);

      setPosts(allPosts);
    } catch (error) {
      console.error("Erro ao carregar posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPullRequests = async () => {
    try {
      const response = await fetch("/api/pull-requests");
      const data = await response.json();
      setPullRequests(data);
    } catch (error) {
      console.error("Erro ao carregar pull requests:", error);
    }
  };

  const extractTitle = (filename: string): string => {
    return filename
      .replace(".md", "")
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const getPostStatus = (post: Post) => {
    if (post.published) {
      return { label: "Publicado", color: "status-published" };
    }

    const hasPR = pullRequests.find((pr) => pr.head.ref === post.branch);
    if (hasPR) {
      return { label: "Aguardando Publicação", color: "status-pending" };
    }

    return { label: "Rascunho", color: "status-draft" };
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
      const response = await fetch("/api/files", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
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
        alert("Erro ao excluir post");
      }
    } catch (error) {
      console.error("Erro ao excluir:", error);
      alert("Erro ao excluir post");
    } finally {
      setDeleting(null);
    }
  };

  const handlePublish = async (post: Post) => {
    const pr = pullRequests.find((pr) => pr.head.ref === post.branch);
    if (!pr) {
      alert("Pull request não encontrado");
      return;
    }

    if (!confirm(`Tem certeza que deseja publicar "${post.title}"?`)) {
      return;
    }

    setPublishing(pr.number);
    try {
      const response = await fetch(`/api/pull-requests/${pr.number}/merge`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          commitTitle: `Publicar: ${post.title}`,
        }),
      });

      if (response.ok) {
        // Deletar branch após merge
        await fetch("/api/branches", {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ branchName: post.branch }),
        });

        await fetchPosts();
        await fetchPullRequests();
        alert("Post publicado com sucesso!");
      } else {
        alert("Erro ao publicar post");
      }
    } catch (error) {
      console.error("Erro ao publicar:", error);
      alert("Erro ao publicar post");
    } finally {
      setPublishing(null);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Carregando posts...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-bold text-primary text-2xl">Posts</h1>
          <a
            href="/posts/new"
            className="flex items-center space-x-2 bg-secondary hover:bg-blue-medium-light px-4 py-2 rounded-lg text-white transition-colors duration-250"
          >
            <span>➕</span>
            <span>Novo Post</span>
          </a>
        </div>

        {posts.length === 0 ? (
          <div className="bg-card p-8 border border-primary rounded-lg text-center">
            <div className="mb-4 text-4xl">📝</div>
            <h3 className="mb-2 font-medium text-primary text-lg">Nenhum post encontrado</h3>
            <p className="mb-4 text-secondary">Comece criando seu primeiro post</p>
            <a
              href="/posts/new"
              className="bg-secondary hover:bg-blue-medium-light px-6 py-3 rounded-lg text-white transition-colors duration-250"
            >
              Criar Primeiro Post
            </a>
          </div>
        ) : (
          <div className="bg-white border border-primary rounded-lg overflow-hidden">
            <table className="divide-y divide-primary min-w-full">
              <thead className="bg-table-header">
                <tr>
                  <th className="px-6 py-3 font-medium text-secondary text-xs text-left uppercase tracking-wider">
                    Nome do Arquivo
                  </th>
                  <th className="px-6 py-3 font-medium text-secondary text-xs text-left uppercase tracking-wider">
                    Título
                  </th>
                  <th className="px-6 py-3 font-medium text-secondary text-xs text-left uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 font-medium text-secondary text-xs text-right uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-primary">
                {posts.map((post) => {
                  const status = getPostStatus(post);
                  const pr = pullRequests.find((pr) => pr.head.ref === post.branch);

                  return (
                    <>
                      <tr
                        key={`${post.branch}-${post.path}`}
                        className="hover:bg-card/30 transition-colors duration-250"
                      >
                        <td className="px-6 py-4 font-medium text-primary text-sm whitespace-nowrap">{post.name}</td>
                        <td className="px-6 py-4 text-primary text-sm whitespace-nowrap">{post.title}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="space-x-2 px-6 py-4 text-sm text-right whitespace-nowrap">
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
                              className="disabled:opacity-50 text-accent hover:text-secondary transition-colors duration-250"
                            >
                              {publishing === pr.number ? "⏳" : "🚀"} Publicar
                            </button>
                          )}

                          <button
                            onClick={() => handleDelete(post)}
                            disabled={deleting === post.path}
                            className="disabled:opacity-50 text-red-600 hover:text-red-900"
                          >
                            {deleting === post.path ? "⏳" : "🗑️"} Excluir
                          </button>
                        </td>
                      </tr>
                      {post.contentVersions.map((version) => (
                        <tr
                          key={`${version.branch}-${version.path}`}
                          className="hover:bg-card/30 transition-colors duration-250"
                        >
                          <td className="px-6 py-4 font-medium text-secondary text-sm whitespace-nowrap">
                            {version.name}
                          </td>
                          <td className="px-6 py-4 text-secondary text-sm whitespace-nowrap">{version.title}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td className="space-x-2 px-6 py-4 text-sm text-right whitespace-nowrap">
                            <button
                              onClick={() => handleEdit(version)}
                              className="text-secondary hover:text-primary transition-colors duration-250"
                            >
                              ✏️ Editar
                            </button>
                            <button
                              onClick={() => handleDelete(version)}
                              disabled={deleting === version.path}
                              className="disabled:opacity-50 text-red-600 hover:text-red-900"
                            >
                              {deleting === version.path ? "⏳" : "🗑️"} Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                      {post.contentVersions.length > 0 && (
                        <tr className="bg-gray-100">
                          <td colSpan={4} className="px-6 py-2 text-secondary text-xs italic">
                            {post.contentVersions.length} versão(s) deste post
                          </td>
                        </tr>
                      )}
                    </>
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
