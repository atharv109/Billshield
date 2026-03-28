import { Sidebar } from '../dashboard/Sidebar'
import { DashboardTopBar } from '../dashboard/DashboardTopBar'
import { StatsGrid } from '../dashboard/StatsGrid'
import { BillingChart } from '../dashboard/BillingChart'
import { RecentActions } from '../dashboard/RecentActions'
import { CaseCards } from '../dashboard/CaseCards'
import { IssueTable } from '../dashboard/IssueTable'

export default function DashboardPage() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#050810',
        fontFamily: 'Inter, sans-serif',
        overflow: 'hidden',
      }}
    >
      <Sidebar />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <DashboardTopBar title="Overview" />

        {/* Scrollable body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Stats row */}
          <StatsGrid />

          {/* Chart + Recent Actions */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
            <BillingChart />
            <RecentActions />
          </div>

          {/* Case cards */}
          <CaseCards />

          {/* Issue table */}
          <IssueTable />

          {/* Bottom spacing */}
          <div style={{ height: '8px' }} />
        </div>
      </div>
    </div>
  )
}
