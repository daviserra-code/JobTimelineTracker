import React from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";

import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import DashboardTestPage from "./pages/dashboard-test";
import Header from "@/components/header";

function Router() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ flexGrow: 1 }}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/dashboard-test" component={DashboardTestPage} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
    </QueryClientProvider>
  );
}

export default App;
