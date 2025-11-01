import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const imagePath = `/${params.path.join('/')}`;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    const imageUrl = `${apiUrl}${imagePath}`;

    // Fetch the image from the backend
    const response = await fetch(imageUrl, {
      headers: {
        'skip_zrok_interstitial': 'true',
      },
    });

    if (!response.ok) {
      return new NextResponse('Image not found', { status: 404 });
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.error('[Image Proxy] Error fetching image:', error);
    return new NextResponse('Failed to fetch image', { status: 500 });
  }
}

export const dynamic = 'force-dynamic';

