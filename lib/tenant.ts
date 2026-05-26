import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

type SessionUser = { id?: string; role?: string; tenantId?: string };

/**
 * Retourne le tenantId actif.
 * Si le user est superadmin et qu'un cookie view_as_tenant est présent → utilise ce tenantId.
 * isReadOnly = true dans ce cas (lecture seule).
 */
export async function requireTenant(): Promise<
  { tenantId: string; isReadOnly: boolean; role: string } | NextResponse
> {
  const session = await getServerSession(authOptions);
  const user = session?.user as SessionUser;
  if (!user?.tenantId) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  if (user.role === "superadmin") {
    const jar = await cookies();
    const viewAs = jar.get("view_as_tenant")?.value;
    if (viewAs) {
      const editMode = jar.get("view_as_edit")?.value === "true";
      return { tenantId: viewAs, isReadOnly: !editMode, role: "superadmin" };
    }
    // Superadmin sans view-as : accès à son propre tenant
    return { tenantId: user.tenantId, isReadOnly: false, role: "superadmin" };
  }

  return { tenantId: user.tenantId, isReadOnly: false, role: user.role || "admin" };
}

/** Helper : renvoie 403 si on est en mode lecture seule */
export function rejectIfReadOnly(t: { isReadOnly: boolean }) {
  if (t.isReadOnly) {
    return NextResponse.json({ error: "Mode consultation — modifications interdites." }, { status: 403 });
  }
  return null;
}
