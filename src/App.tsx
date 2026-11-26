import { lazy, Suspense } from 'react';
import { usePath } from './router';
import StartPage from './pages/StartPage';

const HostPage = lazy(() => import('./pages/HostPage'));
const PlayerPage = lazy(() => import('./pages/PlayerPage'));
const RanglistePage = lazy(() => import('./pages/RanglistePage'));

export default function App() {
  const path = usePath();
  let seite: JSX.Element;
  const join = path.match(/^\/join\/?([A-Za-z]*)\/?$/);
  if (path.startsWith('/host')) seite = <HostPage />;
  else if (join) seite = <PlayerPage code={join[1].toUpperCase()} />;
  else if (path.startsWith('/rangliste')) seite = <RanglistePage />;
  else seite = <StartPage />;
  return <Suspense fallback={<div className="min-h-screen" />}>{seite}</Suspense>;
}
