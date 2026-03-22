import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { TreePage } from './pages/TreePage';
import { Landing } from './pages/Landing';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<TreePage id={3058} />} />
        <Route path="/tree/:id" element={<TreePage />} />
        <Route path="*" element={<Landing />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
