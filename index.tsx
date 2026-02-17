
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Prévention du crash "process is not defined" fréquent lors du déploiement
// sur des hébergeurs statiques comme Netlify quand on utilise process.env
if (typeof (window as any).process === 'undefined') {
  (window as any).process = {
    env: {
      API_KEY: '' // Sera injecté par l'environnement si disponible
    }
  };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Erreur critique : L'élément #root est introuvable dans le DOM.");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
