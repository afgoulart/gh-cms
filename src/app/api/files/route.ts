import { NextRequest, NextResponse } from "next/server";

import { githubCMS } from "@/lib/github";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path');
  const branch = searchParams.get('branch');
  const validBranch = branch && branch !== 'undefined' && branch !== '' ? branch : undefined;

  if (!path) {
    return NextResponse.json(
      { error: 'Path é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const file = await githubCMS.getFile(path, validBranch);
    if (!file) {
      return NextResponse.json(
        { error: 'Arquivo não encontrado' },
        { status: 404 }
      );
    }
    return NextResponse.json(file);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar arquivo' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { path, content, message, sha, branch, isNewFile } = await request.json();

    if (!path || !content || !message) {
      return NextResponse.json(
        { error: 'Path, content e message são obrigatórios' },
        { status: 400 }
      );
    }

    const result = await githubCMS.createOrUpdateFile(
      path, 
      content, 
      message, 
      sha, 
      branch, 
      isNewFile
    );
    
    if (result.success) {
      return NextResponse.json(result);
    } else {
      return NextResponse.json(
        { error: 'Erro ao criar/atualizar arquivo' },
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
    const { path, sha, message, branch } = await request.json();

    if (!path || !sha || !message) {
      return NextResponse.json(
        { error: 'Path, sha e message são obrigatórios' },
        { status: 400 }
      );
    }

    const success = await githubCMS.deleteFile(path, sha, message, branch);
    
    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Erro ao deletar arquivo' },
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