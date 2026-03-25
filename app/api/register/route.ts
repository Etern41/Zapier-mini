import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const { fieldErrors, formErrors } = parsed.error.flatten();
    const firstField = Object.values(fieldErrors).find(
      (m): m is string[] => Array.isArray(m) && m.length > 0
    )?.[0];
    const msg =
      firstField ??
      formErrors[0] ??
      "Некорректные данные";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({
    where: { email: parsed.data.email },
  });
  if (exists) {
    return NextResponse.json(
      { error: "Пользователь с таким email уже существует" },
      { status: 400 }
    );
  }

  const password = await bcrypt.hash(parsed.data.password, 12);
  await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      password,
    },
  });

  return NextResponse.json({ ok: true });
}
