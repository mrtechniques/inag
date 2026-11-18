import React, { useState, useEffect } from 'react';
import { DisplayPage } from './pages/DisplayPage';
import { ControllerPage } from './pages/ControllerPage';
import { AdminPage } from './pages/AdminPage';
import { LandingPage } from './pages/LandingPage';

export const App: React.FC = () => {
  const [route, setRoute] = useState<string>(() => {
    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase().replace('#', '');
    if (hash.includes('display') || path.includes('display')) return 'display';
    if (hash.includes('controller') || path.includes('controller')) return 'controller';
    if (hash.includes('admin') || path.includes('admin')) return 'admin';
    return 'hub';
  });

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase().replace('#', '');
      if (hash.includes('display') || path.includes('display')) setRoute('display');
      else if (hash.includes('controller') || path.includes('controller')) setRoute('controller');
      else if (hash.includes('admin') || path.includes('admin')) setRoute('admin');
      else setRoute('hub');
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  switch (route) {
    case 'display':
      return <DisplayPage />;
    case 'controller':
      return <ControllerPage />;
    case 'admin':
      return <AdminPage />;
    case 'hub':
    default:
      return <LandingPage />;
  }
};

export default App;
