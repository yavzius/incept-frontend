import type { Route } from './+types/home';
import { QuestionDashboard } from '../features/questions/components';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Incept AI' },
    { name: 'description', content: 'Generate Questions using API' },
  ];
}

export default function Home() {
  return <QuestionDashboard />;
}
