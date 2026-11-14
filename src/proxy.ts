import { NextResponse, type NextRequest } from 'next/server';

const MENSAJE_NO_AUTORIZADO = {
  ok: false,
  error: {
    codigo: 'NO_AUTORIZADO',
    mensaje: 'Debe iniciar sesión.',
  },
};

export function proxy(request: NextRequest) {
  if (request.cookies.has('sb-access-token')) return NextResponse.next();

  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.json(MENSAJE_NO_AUTORIZADO, {
      status: 401,
      headers: { 'Cache-Control': 'no-store' },
    });
  }

  return NextResponse.redirect(new URL('/login', request.url));
}

export const config = {
  matcher: ['/tienda/:path*', '/api/tienda/:path*', '/api/data/:path*'],
};
