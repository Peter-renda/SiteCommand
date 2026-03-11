import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProjectDetail from "./pages/ProjectDetail";
import DailyLog from "./pages/DailyLog";
import Directory from "./pages/Directory";
import Tasks from "./pages/Tasks";
import RFIs from "./pages/RFIs";
import Submittals from "./pages/Submittals";
import PunchList from "./pages/PunchList";
import Schedule from "./pages/Schedule";
import Photos from "./pages/Photos";
import Drawings from "./pages/Drawings";
import Admin from "./pages/Admin";
import Pricing from "./pages/Pricing";
import Reporting from "./pages/Reporting";
import Insights from "./pages/Insights";
export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/projects/:id/daily-log" element={<DailyLog />} />
        <Route path="/projects/:id/directory" element={<Directory />} />
        <Route path="/projects/:id/tasks" element={<Tasks />} />
        <Route path="/projects/:id/rfis" element={<RFIs />} />
        <Route path="/projects/:id/submittals" element={<Submittals />} />
        <Route path="/projects/:id/punch-list" element={<PunchList />} />
        <Route path="/projects/:id/schedule" element={<Schedule />} />
        <Route path="/projects/:id/photos" element={<Photos />} />
        <Route path="/projects/:id/drawings" element={<Drawings />} />
        <Route path="/projects/:id/reporting" element={<Reporting />} />
        <Route path="/projects/:id/insights" element={<Insights />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}
