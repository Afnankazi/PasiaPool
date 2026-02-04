import { withAuth } from "next-auth/middleware"

export default withAuth(
  function middleware(req) {
    console.log("Middleware token:", req.nextauth.token)
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token
      },
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ]
}