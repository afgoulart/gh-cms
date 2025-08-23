import { NextRequest, NextResponse } from 'next/server';
import { githubCMS } from '@/lib/github';

export async function GET() {
  try {
    const pullRequests = await githubCMS.getPullRequests();
    return NextResponse.json(pullRequests);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar pull requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, head, base, body } = await request.json();

    if (!title || !head) {
      return NextResponse.json(
        { error: 'Título e branch de origem são obrigatórios' },
        { status: 400 }
      );
    }

    const pullRequest = await githubCMS.createPullRequest(title, head, base, body);
    
    if (pullRequest) {
      return NextResponse.json(pullRequest);
    } else {
      return NextResponse.json(
        { error: 'Erro ao criar pull request' },
        { status: 500 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}