import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { Income } from './pages/Income';
import { Staking } from './pages/Staking';
import { Marketplace } from './pages/Marketplace';
import { Messages } from './pages/Messages';
import { Rewards } from './pages/Rewards';
import { useAlchemyEvents } from './hooks/useAlchemyEvents';

function App() {
  // Set up WebSocket event listeners
  useAlchemyEvents();

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/income" element={<Income />} />
        <Route path="/staking" element={<Staking />} />
        <Route path="/marketplace" element={<Marketplace />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/rewards" element={<Rewards />} />
      </Routes>
    </Router>
  );
}

export default App;