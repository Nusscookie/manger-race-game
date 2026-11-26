import { usePath } from './router';
import StartPage from './pages/StartPage';

export default function App() {
  const path = usePath();
  void path;
  return <StartPage />;
}
