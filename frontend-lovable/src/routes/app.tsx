import { createFileRoute } from "@tanstack/react-router";
import App from "@/components/riderecord/App";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "RideRecord — log rides, draft complaints" },
      { name: "description", content: "Log paratransit and Medicaid rides, draft complaints, and see reliability patterns." },
      { property: "og:title", content: "RideRecord" },
      { property: "og:description", content: "Log paratransit and Medicaid rides, draft complaints, and see reliability patterns." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: App,
});
