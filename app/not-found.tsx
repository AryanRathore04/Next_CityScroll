"use client"
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Route } from "next";

export default function NotFound() {
  return (
    <main className="min-h-[60vh] max-w-xl mx-auto flex flex-col items-center justify-center gap-6 text-center px-6">
      <h1 className="text-4xl font-heading text-foreground">Page not found</h1>
      <p className="text-muted-foreground">
        Sorry, we couldn’t find the page you’re looking for.
      </p>
      <Button asChild>
        <Link href={("/" as Route)} className="inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Go back home
        </Link>
      </Button>
    </main>
  );
}
