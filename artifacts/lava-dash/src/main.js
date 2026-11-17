import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './style.css';

const mount = document.getElementById('root');
if (!mount) throw new Error('Missing application mount point');

createRoot(mount, {
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(createElement(ErrorBoundary, null, createElement(App)));
