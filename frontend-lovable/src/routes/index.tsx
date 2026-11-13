import { createFileRoute } from "@tanstack/react-router";
import Landing from "@/components/riderecord/Landing";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RideRecord — the appointment was at nine, the ride never came" },
      { name: "description", content: "Log a paratransit ride in 10 seconds. RideRecord turns it into a complaint that reaches the right office before the deadline." },
      { property: "og:title", content: "RideRecord" },
      { property: "og:description", content: "Log a paratransit ride in 10 seconds. RideRecord turns it into a complaint that reaches the right office before the deadline." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});
