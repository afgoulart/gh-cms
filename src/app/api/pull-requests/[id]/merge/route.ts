import { NextRequest, NextResponse } from 'next/server';
import { githubCMS } from '@/lib/github';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { commitTitle } = await request.json();
    
    const pullNumber = parseInt(id);
    if (isNaN(pullNumber)) {
      return NextResponse.json(
        { error: 'ID do pull request inválido' },
        { status: 400 }
      );
    }

    const success = await githubCMS.mergePullRequest(pullNumber, commitTitle);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Erro ao fazer merge do pull request' },
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