import { NextRequest, NextResponse } from 'next/server';
import { githubCMS } from '@/lib/github';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  const branch = searchParams.get('branch');
  const validBranch = branch && branch !== 'undefined' && branch !== '' ? branch : undefined;

  try {
    const contents = await githubCMS.getContents(path, validBranch);
    return NextResponse.json(contents);
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao buscar conteúdos' },
      { status: 500 }
    );
  }
}