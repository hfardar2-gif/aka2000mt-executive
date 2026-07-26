import { createFileRoute } from "@tanstack/react-router";
import { Route as DataEntryFeatureRoute } from "@/features/data-transformer-page";

const DataTransformerPage = (DataEntryFeatureRoute as any).options.component;

export const Route = createFileRoute("/data-transformer")({
  head: () => ({
    meta: [
      { title: "AKA Project Report — Live Data Entry" },
      {
        name: "description",
        content: "Secure data entry with automatic GitHub save and Cloudflare deployment.",
      },
    ],
  }),
  component: DataTransformerPage,
});
