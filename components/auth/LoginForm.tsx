"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });
      if (res?.error) {
        setError("root", {
          message: "Неверный email или пароль",
        });
        return;
      }
      const cb = searchParams.get("callbackUrl") ?? "/workflows";
      router.push(cb);
    } finally {
      setLoading(false);
    }
  });

  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm">
      <h1 className="text-xl font-semibold text-foreground">Вход</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Войдите в AutoFlow
      </p>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            disabled={loading}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            disabled={loading}
            {...register("password")}
          />
          {errors.password && (
            <p className="text-xs text-destructive">
              {errors.password.message}
            </p>
          )}
        </div>
        {errors.root && (
          <p className="text-sm text-destructive">{errors.root.message}</p>
        )}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Вход…
            </>
          ) : (
            "Войти"
          )}
        </Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Нет аккаунта?{" "}
        <Link href="/register" className="text-primary hover:underline">
          Регистрация
        </Link>
      </p>
    </div>
  );
}
