export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return new Response('URL não informada', { status: 400 });
    }

    const resposta = await fetch(imageUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });

    if (!resposta.ok) {
      return new Response('Erro ao obter imagem oficial do TSE', {
        status: resposta.status,
      });
    }

    const contentType = resposta.headers.get('content-type') || 'image/jpeg';
    const buffer = await resposta.arrayBuffer();

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch (error: any) {
    return new Response(error?.message || 'Falha ao processar proxy de foto', {
      status: 500,
    });
  }
}
