import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/admin/:path*",
    "/dashboard/:path*",
    "/donateurs/:path*",
    "/cerfa/:path*",
    "/parametres/:path*",
    "/recapitulatif/:path*",
    "/import/:path*",
    "/api/donateurs/:path*",
    "/api/cerfa/:path*",
    "/api/association/:path*",
    "/api/dashboard/:path*",
    "/api/export/:path*",
    "/api/import/:path*",
    "/api/upload/:path*",
    "/api/pdf/:path*",
  ],
};
