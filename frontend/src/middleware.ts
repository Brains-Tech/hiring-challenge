import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';



export default async function middleware(request: NextRequest) {
    const token = request.cookies.get('COODEX::TOKEN');
    const signInURL = new URL('/auth/signin', request.url);
    const dashboardURL = new URL('/', request.url);

    if (request.nextUrl.pathname.startsWith('/_next/')) {
        return NextResponse.next();
    }

    if (!token) {
        if (request.nextUrl.pathname === '/auth/signin' ||
            request.nextUrl.pathname === "/auth/signup") {
            return NextResponse.next();
        }

        return NextResponse.redirect(signInURL);
    }

    if (request.nextUrl.pathname === '/auth/signin') {
        return NextResponse.redirect(dashboardURL);
    }

    try {
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/token-validate`, {
            method: 'GET',
            headers: {
                Authorization: `Bearer ${token.value}`
            }
        });
        return NextResponse.next();
    } catch (error) {
        console.error('Error: ', error);
        const response = NextResponse.redirect(signInURL);
        response.cookies.delete('COODEX::TOKEN');
        return response;
    }
}