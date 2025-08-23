import { NextRequest, NextResponse } from 'next/server';
import { githubCMS } from '@/lib/github';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filePath = searchParams.get('path');
  
  if (!filePath) {
    return NextResponse.json(
      { error: 'Caminho do arquivo é obrigatório' },
      { status: 400 }
    );
  }

  try {
    const versions = await githubCMS.getFileVersions(filePath);
    return NextResponse.json(versions);
  } catch (error) {
    console.error('Erro ao buscar versões do arquivo:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar versões do arquivo' },
      { status: 500 }
    );
  }
}