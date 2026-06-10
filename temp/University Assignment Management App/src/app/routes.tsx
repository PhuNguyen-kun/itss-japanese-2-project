import { createBrowserRouter, Navigate } from "react-router";
import { Home } from "./components/Home";
import { CreateAssignment } from "./components/CreateAssignment";
import { RoadmapView } from "./components/RoadmapView";
import { TaskDetail } from "./components/TaskDetail";
import { DepositPoints } from "./components/DepositPoints";
import { Layout } from "./components/Layout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "create", Component: CreateAssignment },
      { path: "roadmap/:assignmentId", Component: RoadmapView },
      { path: "task/:taskId", Component: TaskDetail },
      { path: "deposit", Component: DepositPoints },
      { path: "risk", element: <Navigate to="/" replace /> },
      { path: "social", element: <Navigate to="/" replace /> },
    ],
  },
]);
