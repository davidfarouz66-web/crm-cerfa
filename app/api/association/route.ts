import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const association = await prisma.association.findFirst();
  return NextResponse.json(association || {});
}

export async function PUT(req: Request) {
  const body = await req.json();
  const existing = await prisma.association.findFirst();
  if (existing) {
    const updated = await prisma.association.update({ where: { id: existing.id }, data: body });
    return NextResponse.json(updated);
  }
  const created = await prisma.association.create({ data: body });
  return NextResponse.json(created);
}
