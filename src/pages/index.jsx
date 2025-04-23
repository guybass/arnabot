import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import TaskDependencyGraph from "./TaskDependencyGraph";

import TaskManager from "./TaskManager";

import ProjectDashboard from "./ProjectDashboard";

import TeamCalendar from "./TeamCalendar";

import TeamManagement from "./TeamManagement";

import Navigation from "./Navigation";

import README from "./README";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    TaskDependencyGraph: TaskDependencyGraph,
    
    TaskManager: TaskManager,
    
    ProjectDashboard: ProjectDashboard,
    
    TeamCalendar: TeamCalendar,
    
    TeamManagement: TeamManagement,
    
    Navigation: Navigation,
    
    README: README,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/TaskDependencyGraph" element={<TaskDependencyGraph />} />
                
                <Route path="/TaskManager" element={<TaskManager />} />
                
                <Route path="/ProjectDashboard" element={<ProjectDashboard />} />
                
                <Route path="/TeamCalendar" element={<TeamCalendar />} />
                
                <Route path="/TeamManagement" element={<TeamManagement />} />
                
                <Route path="/Navigation" element={<Navigation />} />
                
                <Route path="/README" element={<README />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}