import { useState, useEffect } from 'react';
import { FunctionCard } from '../components';
import { safeGet } from '../services/apiClient';

const cleanPayload = payload =>
  Object.entries(payload).reduce((acc, [key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});

const TOKEN_FUNCTIONS = [
  {
    key: 'getPendingTokenRequests',
    title: 'View Pending Access Requests',
    description: 'Review all pending requests for currency access permissions.',
    method: 'GET',
    endpoint: '/token-requests/pending',
    fields: []
  },
  {
    key: 'approveTokenRequest',
    title: 'Approve/Reject Access Request',
    description: 'Grant or deny currency access for a specific account.',
    method: 'POST',
    endpoint: '/token-requests/:requestId/approve',
    fields: [
      { name: 'requestId', label: 'Request ID', required: true, placeholder: 'Account identifier or request ID' },
      {
        name: 'status',
        label: 'Decision',
        options: [
          { value: 'approved', label: 'Approve' },
          { value: 'rejected', label: 'Reject' }
        ],
        defaultValue: 'approved'
      }
    ],
    buildRequest: values => {
      if (!values.requestId) throw new Error('Request ID is required');
      return {
        url: `/token-requests/${encodeURIComponent(values.requestId)}/approve`,
        data: cleanPayload({ status: values.status })
      };
    }
  }
];

const MINT_FUNCTIONS = [
  {
    key: 'getPendingMintRequests',
    title: 'View Pending Fund Requests',
    description: 'Review all pending requests to issue new funds.',
    method: 'GET',
    endpoint: '/mint-requests/pending',
    fields: []
  },
  {
    key: 'approveMintRequest',
    title: 'Approve/Reject Fund Request',
    description: 'Approve or deny a fund issuance request.',
    method: 'POST',
    endpoint: '/mint-requests/:requestId/approve',
    fields: [
      { name: 'requestId', label: 'Request ID', required: true, placeholder: 'Fund request identifier' },
      {
        name: 'status',
        label: 'Decision',
        options: [
          { value: 'approved', label: 'Approve' },
          { value: 'rejected', label: 'Reject' }
        ],
        defaultValue: 'approved'
      }
    ],
    buildRequest: values => {
      if (!values.requestId) throw new Error('Request ID is required');
      return {
        url: `/mint-requests/${encodeURIComponent(values.requestId)}/approve`,
        data: cleanPayload({ status: values.status })
      };
    }
  }
];

const LIST_FUNCTIONS = [
  {
    key: 'listAssignedTokens',
    title: 'View Assigned Currencies',
    description: 'List all currencies that have been assigned to institutions.',
    method: 'GET',
    endpoint: '/bank/assigned-tokens',
    fields: [{ name: 'userId', label: 'User ID', placeholder: 'Filter by user (optional)' }],
    buildRequest: values => ({
      params: cleanPayload({ userId: values.userId })
    })
  },
  {
    key: 'getApprovedMintRequests',
    title: 'View Approved Fund Requests',
    description: 'View all fund requests that have been approved.',
    method: 'GET',
    endpoint: '/mint-requests/approved',
    fields: [{ name: 'userId', label: 'User ID', placeholder: 'Filter by user (optional)' }],
    buildRequest: values => ({
      params: cleanPayload({ userId: values.userId })
    })
  }
];

const StatCard = ({ icon, label, value, subtext, color = 'white' }) => (
  <div className="glass-panel p-6 border border-white/5">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-white/50 mb-1">{label}</p>
        <p className={`text-3xl font-bold text-${color} mb-1`}>{value}</p>
        {subtext && <p className="text-xs text-white/40">{subtext}</p>}
      </div>
      <div className="text-3xl opacity-20">{icon}</div>
    </div>
  </div>
);

const Section = ({ title, subtitle, helper, cards, icon }) => (
  <div className="glass-panel p-6 space-y-6 border border-white/5">
    <div className="flex items-start gap-4">
      <div className="text-4xl">{icon}</div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-white/40">{title}</p>
        <h3 className="text-2xl font-semibold mb-1">{subtitle}</h3>
        {helper && <p className="text-sm text-white/60">{helper}</p>}
      </div>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      {cards.map(fn => (
        <FunctionCard key={fn.key} {...fn} />
      ))}
    </div>
  </div>
);

const AdminDashboard = () => {
  const [activeLane, setActiveLane] = useState('token');
  const [stats, setStats] = useState({
    pendingAccess: 0,
    pendingFunds: 0,
    approved: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          tokenReqs, 
          mintReqs,
          approvedTokens,
          approvedMints
        ] = await Promise.all([
          safeGet('/token-requests/pending', []),
          safeGet('/mint-requests/pending', []),
          safeGet('/bank/assigned-tokens', []),
          safeGet('/mint-requests/approved', [])
        ]);
        
        // Calculate approved today
        const today = new Date().toDateString();
        const allApproved = [
          ...(Array.isArray(approvedTokens) ? approvedTokens : []),
          ...(Array.isArray(approvedMints) ? approvedMints : [])
        ];
        
        const approvedToday = allApproved.filter(item => {
          if (!item.timestamp && !item.approvedAt && !item.approved_at) return false;
          const approvalDate = new Date(
            item.timestamp || item.approvedAt || item.approved_at
          ).toDateString();
          return approvalDate === today;
        }).length;
        
        setStats({
          pendingAccess: Array.isArray(tokenReqs) ? tokenReqs.length : 0,
          pendingFunds: Array.isArray(mintReqs) ? mintReqs.length : 0,
          approved: approvedToday
        });
      } catch (error) {
        console.warn('Failed to fetch admin stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 space-y-4 border border-white/5">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">Administrative Dashboard</p>
          <h2 className="text-3xl font-bold mt-1">System Management</h2>
          <p className="text-sm text-white/60 mt-2">
            Review and approve currency access requests and fund issuance requests.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          icon="⏳" 
          label="Pending Access Requests" 
          value={stats.pendingAccess.toLocaleString()} 
          subtext="Currency permissions" 
          color="amber-400"
        />
        <StatCard 
          icon="💵" 
          label="Pending Fund Requests" 
          value={stats.pendingFunds.toLocaleString()} 
          subtext="Awaiting approval" 
          color="amber-400"
        />
        <StatCard 
          icon="✅" 
          label="Approved Today" 
          value={stats.approved.toLocaleString()} 
          subtext="Total approvals" 
          color="green-400"
        />
      </div>

      <div className="glass-panel p-6 space-y-4 border border-white/5">
        <div>
          <h3 className="text-xl font-semibold mb-2">Select Management Category</h3>
          <p className="text-sm text-white/60">
            Choose a category to review pending requests and manage approvals.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveLane('token')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition ${
              activeLane === 'token'
                ? 'bg-accent text-slate-950'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            💰 Currency Access
          </button>
          <button
            type="button"
            onClick={() => setActiveLane('mint')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition ${
              activeLane === 'mint'
                ? 'bg-accent text-slate-950'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            💵 Fund Requests
          </button>
          <button
            type="button"
            onClick={() => setActiveLane('list')}
            className={`px-6 py-3 rounded-xl text-sm font-semibold transition ${
              activeLane === 'list'
                ? 'bg-accent text-slate-950'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            📋 View Records
          </button>
        </div>
      </div>

      {activeLane === 'token' && (
        <Section
          icon="💰"
          title="Currency Access Management"
          subtitle="Review and Approve Access Requests"
          helper="Step 1: Review pending requests for currency access. Step 2: Approve or reject each request based on account verification."
          cards={TOKEN_FUNCTIONS}
        />
      )}

      {activeLane === 'mint' && (
        <Section
          icon="💵"
          title="Fund Issuance Management"
          subtitle="Review and Approve Fund Requests"
          helper="Step 1: Review the pending fund issuance queue. Step 2: Approve or reject fund requests based on verification and policies."
          cards={MINT_FUNCTIONS}
        />
      )}

      {activeLane === 'list' && (
        <Section
          icon="📋"
          title="Records and History"
          subtitle="View Approved Items"
          helper="View all currencies that have been assigned and fund requests that have been approved."
          cards={LIST_FUNCTIONS}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
