import type { Route } from './+types/home';
import { QuestionDashboard } from '../features/questions/components';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'JSON Question Grader' },
    { name: 'description', content: 'Grade questions using the API' },
  ];
}

export default function Home() {
  return <QuestionDashboard />;
}
