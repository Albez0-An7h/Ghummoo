import { Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Package, Sparkles, Ticket, Building2, BarChart3 } from 'lucide-react';
import DashboardShell from '../../components/DashboardShell';
import { Spinner, ErrorState, Notice } from '../../components/ui';
import useAsync from '../../lib/useAsync';
import api from '../../lib/api';
import Onboarding from './Onboarding';

const NAV = [
  { to: '/operator', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/operator/packages', label: 'Packages', icon: Package },
  { to: '/operator/studio', label: 'AI Package Studio', icon: Sparkles },
  { to: '/operator/bookings', label: 'Bookings', icon: Ticket },
  { to: '/operator/insights', label: 'Insights', icon: BarChart3 },
  { to: '/operator/profile', label: 'Business profile', icon: Building2 },
];

export default function OperatorLayout() {
  const { data, error, loading, reload } = useAsync(() => api.get('/operator/profile'), []);
  const operator = data?.operator || null;
  const verification = data?.verification || null;
  const reloadOperator = () => reload({ silent: true });

  let banner = null;
  if (operator?.status === 'pending') {
    banner = (
      <div className="px-4 pt-4 sm:px-6 lg:px-10">
        <Notice tone="warning" title="Your profile is under review" className="mx-auto max-w-6xl">
          You can create drafts, but publishing unlocks after approval.
        </Notice>
      </div>
    );
  } else if (operator?.status === 'rejected') {
    banner = (
      <div className="px-4 pt-4 sm:px-6 lg:px-10">
        <Notice tone="danger" title="Your operator application was not approved" className="mx-auto max-w-6xl">
          {operator.statusNote ? <p>Reason: {operator.statusNote}</p> : null}
          <p className="mt-1">Update your <Link to="/operator/profile" className="font-bold underline">business profile</Link> to send it back for review.</p>
        </Notice>
      </div>
    );
  }

  let content;
  if (loading && !data) content = <Spinner label="Loading your workspace" />;
  else if (error) content = <ErrorState error={error} onRetry={reload} />;
  else if (!operator) content = <Onboarding onCreated={reloadOperator} />;
  else content = <Outlet context={{ operator, verification, reloadOperator }} />;

  return <DashboardShell nav={NAV} title="Operator" banner={banner}>{content}</DashboardShell>;
}
