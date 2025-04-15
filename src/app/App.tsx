import { FC } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { config } from "../config/wagmi"; // Ensure wagmi config is separate and built properly
import { AdminDashboard, ManageProjects, UserManagement, OwnershipTransfers, AdminGate } from "@/pages/Admin";
import './index.css';
import { Layout } from "@/app/Layout";
import { AdminLayout } from "./AdminLayout";
import { Home, NoMatch, Dashboard } from "@/pages";
import { Projects } from "@/pages/Projects";

// RainbowKit styles
import "@rainbow-me/rainbowkit/styles.css";
import ProjectForm from "@/components/Admin/ProjectForm";

const queryClient = new QueryClient();

const App: FC = () => {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme()}>
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="projects" element={<Projects />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="*" element={<NoMatch />} />
              </Route>
              
              <Route path="/admin" element={
  <AdminGate>
    <AdminLayout />
  </AdminGate>
}>
  <Route index element={<AdminDashboard />} />
  <Route path="projects" element={<ManageProjects />} />
  <Route path="projects/new" element={<ProjectForm />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="transfers" element={<OwnershipTransfers />} />
</Route>

            </Routes>
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
};

export default App;
