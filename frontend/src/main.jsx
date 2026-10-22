import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './styles/site.css';
import './styles/audit.css';
import './styles/port-layout.css';
import './styles/port-home.css';
import './styles/port-products.css';
import './styles/port-company.css';
import './styles/port-content.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
