"use client";
import { useEffect } from "react";
import { installClientErrorHandlers } from "@/lib/client-error-helpers";

export default function ClientInit() {
  useEffect(() => {
    installClientErrorHandlers();
  }, []);

  return null;
}
