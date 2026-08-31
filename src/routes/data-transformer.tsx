import { createFileRoute } from "@tanstack/react-router";
import { DataTransformerPage } from "@/features/data-transformer-page";

export const Route = createFileRoute("/data-transformer")({
  head: () => ({
    meta: [
      { title: "AKA Project Report — Live Data Entry" },
      {
        name: "description",
        content:
          "Secure, validated data entry and controlled publication for the AKA management report.",
      },
    ],
  }),
  component: DataTransformerPage,
});
