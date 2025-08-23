import { NextRequest, NextResponse } from 'next/server';
import { githubCMS } from '@/lib/github';

export async function GET() {
  try {
    const branches = await githubCMS.getBranches();
    return NextResponse.json(branches);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar branches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { branchName, baseBranch } = await request.json();

    if (!branchName) {
      return NextResponse.json(
        { error: 'Nome da branch é obrigatório' },
        { status: 400 }
      );
    }

    const success = await githubCMS.createBranch(branchName, baseBranch);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Erro ao criar branch' },
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

export async function DELETE(request: NextRequest) {
  try {
    const { branchName } = await request.json();

    if (!branchName) {
      return NextResponse.json(
        { error: 'Nome da branch é obrigatório' },
        { status: 400 }
      );
    }

    const success = await githubCMS.deleteBranch(branchName);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Erro ao deletar branch' },
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