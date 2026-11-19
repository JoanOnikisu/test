import { createFileRoute } from "@tanstack/react-router";
import { CartuchoApp } from "@/components/cartucho-app";

export const Route = createFileRoute("/")({
  component: CartuchoApp,
});
