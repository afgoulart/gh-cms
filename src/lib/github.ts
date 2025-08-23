import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const OWNER = process.env.GITHUB_OWNER!;
const REPO = process.env.GITHUB_REPO!;

export interface ContentFile {
  name: string;
  path: string;
  content?: string;
  sha?: string;
  type: 'file' | 'dir';
  branch?: string;
  published?: boolean;
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
  protected: boolean;
}

export interface PullRequest {
  number: number;
  title: string;
  state: string;
  head: {
    ref: string;
  };
  base: {
    ref: string;
  };
  html_url: string;
}

export interface FileVersion {
  branch: string;
  content?: string;
  sha: string;
  lastModified: string;
  author: string;
  commitMessage: string;
  isPublished: boolean;
}

export class GitHubCMS {
  private generateBranchName(fileName: string): string {
    const timestamp = Date.now();
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase();
    return `content/${sanitizedName}-${timestamp}`;
  }

  async getDefaultBranch(): Promise<string> {
    try {
      const { data } = await octokit.rest.repos.get({
        owner: OWNER,
        repo: REPO,
      });
      return data.default_branch;
    } catch (error) {
      console.error('Erro ao buscar branch padrão:', error);
      return 'main';
    }
  }

  async getFirstAvailableBranch(): Promise<string | null> {
    try {
      const branches = await this.getBranches();
      if (branches.length > 0) {
        return branches[0].name;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar branches:', error);
      return null;
    }
  }

  async getBranches(): Promise<Branch[]> {
    try {
      const { data } = await octokit.rest.repos.listBranches({
        owner: OWNER,
        repo: REPO,
      });

      return data.map(branch => ({
        name: branch.name,
        commit: branch.commit,
        protected: branch.protected,
      }));
    } catch (error) {
      console.error('Erro ao buscar branches:', error);
      return [];
    }
  }

  async createBranch(branchName: string, baseBranch?: string): Promise<boolean> {
    try {
      let targetBaseBranch = baseBranch;
      
      if (!targetBaseBranch) {
        targetBaseBranch = await this.getDefaultBranch();
      }

      // Tenta buscar a branch base, se falhar, tenta a primeira disponível
      let baseRef;
      try {
        const { data } = await octokit.rest.git.getRef({
          owner: OWNER,
          repo: REPO,
          ref: `heads/${targetBaseBranch}`,
        });
        baseRef = data;
      } catch (error) {
        console.log(`Branch ${targetBaseBranch} não encontrada, tentando primeira branch disponível...`);
        const firstBranch = await this.getFirstAvailableBranch();
        if (!firstBranch) {
          throw new Error('Nenhuma branch encontrada no repositório');
        }
        
        const { data } = await octokit.rest.git.getRef({
          owner: OWNER,
          repo: REPO,
          ref: `heads/${firstBranch}`,
        });
        baseRef = data;
      }

      await octokit.rest.git.createRef({
        owner: OWNER,
        repo: REPO,
        ref: `refs/heads/${branchName}`,
        sha: baseRef.object.sha,
      });

      return true;
    } catch (error) {
      console.error('Erro ao criar branch:', error);
      return false;
    }
  }

  async createPullRequest(
    title: string,
    head: string,
    base?: string,
    body?: string
  ): Promise<PullRequest | null> {
    try {
      const targetBase = base || await this.getDefaultBranch();
      
      const { data } = await octokit.rest.pulls.create({
        owner: OWNER,
        repo: REPO,
        title,
        head,
        base: targetBase,
        body,
      });

      return {
        number: data.number,
        title: data.title,
        state: data.state,
        head: data.head,
        base: data.base,
        html_url: data.html_url,
      };
    } catch (error) {
      console.error('Erro ao criar pull request:', error);
      return null;
    }
  }

  async mergePullRequest(pullNumber: number, commitTitle?: string): Promise<boolean> {
    try {
      await octokit.rest.pulls.merge({
        owner: OWNER,
        repo: REPO,
        pull_number: pullNumber,
        commit_title: commitTitle,
        merge_method: 'merge',
      });

      return true;
    } catch (error) {
      console.error('Erro ao fazer merge do pull request:', error);
      return false;
    }
  }

  async deleteBranch(branchName: string): Promise<boolean> {
    try {
      await octokit.rest.git.deleteRef({
        owner: OWNER,
        repo: REPO,
        ref: `heads/${branchName}`,
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar branch:', error);
      return false;
    }
  }

  async getPullRequests(): Promise<PullRequest[]> {
    try {
      const { data } = await octokit.rest.pulls.list({
        owner: OWNER,
        repo: REPO,
        state: 'open',
      });

      return data.map(pr => ({
        number: pr.number,
        title: pr.title,
        state: pr.state,
        head: pr.head,
        base: pr.base,
        html_url: pr.html_url,
      }));
    } catch (error) {
      console.error('Erro ao buscar pull requests:', error);
      return [];
    }
  }

  async getContents(path: string = '', branch?: string): Promise<ContentFile[]> {
    try {
      const targetBranch = branch || await this.getDefaultBranch();
      
      const { data } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path,
        ref: targetBranch,
      });

      if (Array.isArray(data)) {
        const defaultBranch = await this.getDefaultBranch();
        return data.map(item => ({
          name: item.name,
          path: item.path,
          type: item.type as 'file' | 'dir',
          sha: item.sha,
          branch: targetBranch,
          published: targetBranch === defaultBranch,
        }));
      }

      const defaultBranch = await this.getDefaultBranch();
      return [{
        name: data.name,
        path: data.path,
        type: data.type as 'file' | 'dir',
        sha: data.sha,
        branch: targetBranch,
        published: targetBranch === defaultBranch,
        content: data.type === 'file' && 'content' in data 
          ? Buffer.from(data.content, 'base64').toString('utf-8')
          : undefined,
      }];
    } catch (error) {
      console.error('Erro ao buscar conteúdos:', error);
      return [];
    }
  }

  async getFile(path: string, branch?: string): Promise<ContentFile | null> {
    try {
      const targetBranch = branch || await this.getDefaultBranch();
      
      const { data } = await octokit.rest.repos.getContent({
        owner: OWNER,
        repo: REPO,
        path,
        ref: targetBranch,
      });

      if (!Array.isArray(data) && data.type === 'file' && 'content' in data) {
        const defaultBranch = await this.getDefaultBranch();
        return {
          name: data.name,
          path: data.path,
          type: 'file',
          sha: data.sha,
          branch: targetBranch,
          published: targetBranch === defaultBranch,
          content: Buffer.from(data.content, 'base64').toString('utf-8'),
        };
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar arquivo:', error);
      return null;
    }
  }

  async createOrUpdateFile(
    path: string, 
    content: string, 
    message: string,
    sha?: string,
    branch?: string,
    isNewFile?: boolean
  ): Promise<{ success: boolean; branch?: string; pullRequest?: PullRequest }> {
    try {
      let targetBranch = branch;
      let pullRequest: PullRequest | null = null;

      if (isNewFile && !branch) {
        const fileName = path.split('/').pop() || 'new-content';
        targetBranch = this.generateBranchName(fileName);
        
        const branchCreated = await this.createBranch(targetBranch);
        if (!branchCreated) {
          return { success: false };
        }
      }

      await octokit.rest.repos.createOrUpdateFileContents({
        owner: OWNER,
        repo: REPO,
        path,
        message,
        content: Buffer.from(content, 'utf-8').toString('base64'),
        sha,
        branch: targetBranch || await this.getDefaultBranch(),
      });

      if (isNewFile && targetBranch) {
        const defaultBranch = await this.getDefaultBranch();
        if (targetBranch !== defaultBranch) {
          pullRequest = await this.createPullRequest(
            `Novo conteúdo: ${path}`,
            targetBranch,
            defaultBranch,
            `Adicionando novo arquivo: ${path}`
          );
        }
      }

      return { 
        success: true, 
        branch: targetBranch,
        pullRequest: pullRequest || undefined
      };
    } catch (error) {
      console.error('Erro ao criar/atualizar arquivo:', error);
      return { success: false };
    }
  }

  async deleteFile(path: string, sha: string, message: string, branch?: string): Promise<boolean> {
    try {
      const targetBranch = branch || await this.getDefaultBranch();
      
      await octokit.rest.repos.deleteFile({
        owner: OWNER,
        repo: REPO,
        path,
        message,
        sha,
        branch: targetBranch,
      });

      return true;
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error);
      return false;
    }
  }

  async getFileVersions(filePath: string): Promise<FileVersion[]> {
    try {
      const branches = await this.getBranches();
      const versions: FileVersion[] = [];
      const defaultBranch = await this.getDefaultBranch();

      for (const branch of branches) {
        try {
          // Try to get the file from this branch
          const { data } = await octokit.rest.repos.getContent({
            owner: OWNER,
            repo: REPO,
            path: filePath,
            ref: branch.name,
          });

          if (!Array.isArray(data) && data.type === 'file') {
            // Get the latest commit for this file in this branch
            const commits = await octokit.rest.repos.listCommits({
              owner: OWNER,
              repo: REPO,
              path: filePath,
              sha: branch.name,
              per_page: 1,
            });

            const latestCommit = commits.data[0];
            
            versions.push({
              branch: branch.name,
              content: Buffer.from(data.content, 'base64').toString('utf-8'),
              sha: data.sha,
              lastModified: latestCommit?.commit.author?.date || new Date().toISOString(),
              author: latestCommit?.commit.author?.name || 'Unknown',
              commitMessage: latestCommit?.commit.message || 'No commit message',
              isPublished: branch.name === defaultBranch,
            });
          }
        } catch (error) {
          // File doesn't exist in this branch, skip it
          console.log(`File ${filePath} not found in branch ${branch.name}`);
        }
      }

      // Sort by last modified date, published versions first
      return versions.sort((a, b) => {
        if (a.isPublished && !b.isPublished) return -1;
        if (!a.isPublished && b.isPublished) return 1;
        return new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime();
      });
    } catch (error) {
      console.error('Erro ao buscar versões do arquivo:', error);
      return [];
    }
  }
}

export const githubCMS = new GitHubCMS();