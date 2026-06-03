import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { LoginRegisterPage } from "./pages/LoginRegister";
import { MyTeamsPage } from "./pages/MyTeams";
import { TeamWorkspacePage } from "./pages/TeamWorkspace";
import { FinalItineraryPage } from "./pages/FinalItinerary";
import { ItineraryPlanningPage } from "./pages/ItineraryPlanning";
import { TestResultPage } from "./pages/TestResult";
import { TravelBtiTestPage } from "./pages/TravelBtiTest";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRegisterPage />} />
      <Route path="/teams/:teamId/workspace" element={<TeamWorkspacePage />} />
      <Route path="/teams/:teamId/itinerary" element={<ItineraryPlanningPage />} />
      <Route path="/itinerary/:code" element={<FinalItineraryPage />} />
      <Route path="/final-itinerary" element={<FinalItineraryPage />} />
      <Route path="/final-itinerary/:code" element={<FinalItineraryPage />} />
      <Route path="/teams/*" element={<MyTeamsPage />} />
      <Route path="/travel-bti" element={<TravelBtiTestPage />} />
      <Route path="/travel-bti/test" element={<Navigate to="/travel-bti" replace />} />
      <Route path="/travel-bti/result" element={<TestResultPage />} />
      <Route path="/test-result" element={<Navigate to="/travel-bti/result" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
