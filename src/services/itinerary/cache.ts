import { QueryClient } from "@tanstack/react-query";

export const itineraryQueryKeys = {
  all: ["itinerary"] as const,
  team: (teamId: string | number) => ["itinerary", String(teamId)] as const,
  timeline: (teamId: string | number) => ["itinerary", String(teamId), "timeline"] as const,
};

export const invalidateItinerary = (queryClient: QueryClient, teamId: string | number) =>
  queryClient.invalidateQueries({ queryKey: itineraryQueryKeys.team(teamId) });
