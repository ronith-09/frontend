import { useState } from 'react';
import { FunctionCard } from '../components';

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
    title: 'getPendingTokenRequests',
    description: 'Fetch live pending token access requests via /api/token-requests/pending.',
    method: 'GET',
    endpoint: '/token-requests/pending',
    fields: []
  },
  {
    key: 'approveTokenRequest',
    title: 'approveTokenRequest',
    description: 'Approve or reject access for a specific network address.',
    method: 'POST',
    endpoint: '/token-requests/:requestId/approve',
    fields: [
      { name: 'requestId', label: 'requestId', required: true, placeholder: 'network address or request id' },
      {
        name: 'status',
        label: 'status',
        options: [
          { value: 'approved', label: 'approved' },
          { value: 'rejected', label: 'rejected' }
        ],
        defaultValue: 'approved'
      }
    ],
    buildRequest: values => {
      if (!values.requestId) throw new Error('requestId is required');
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
    title: 'getPendingMintRequests',
    description: 'View every pending mint request straight from Fabric.',
    method: 'GET',
    endpoint: '/mint-requests/pending',
    fields: []
  },
  {
    key: 'approveMintRequest',
    title: 'approveMintRequest',
    description: 'Finalize a mint request by id.',
    method: 'POST',
    endpoint: '/mint-requests/:requestId/approve',
    fields: [
      { name: 'requestId', label: 'requestId', required: true, placeholder: 'mint request id' },
      {
        name: 'status',
        label: 'status',
        options: [
          { value: 'approved', label: 'approved' },
          { value: 'rejected', label: 'rejected' }
        ],
        defaultValue: 'approved'
      }
    ],
    buildRequest: values => {
      if (!values.requestId) throw new Error('requestId is required');
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
    title: 'listAssignedTokens',
    description: 'List every token that has already been assigned to an owner via /api/bank/assigned-tokens.',
    method: 'GET',
    endpoint: '/bank/assigned-tokens',
    fields: [{ name: 'userId', label: 'userId', placeholder: 'admin (optional)' }],
    buildRequest: values => ({
      params: cleanPayload({ userId: values.userId })
    })
  },
  {
    key: 'getApprovedMintRequests',
    title: 'getApprovedMintRequests',
    description: 'View mint requests that have been approved via /api/mint-requests/approved.',
    method: 'GET',
    endpoint: '/mint-requests/approved',
    fields: [{ name: 'userId', label: 'userId', placeholder: 'admin (optional)' }],
    buildRequest: values => ({
      params: cleanPayload({ userId: values.userId })
    })
  }
];

const Section = ({ title, subtitle, helper, cards }) => (
  <div className="glass-panel p-6 space-y-4 border border-white/5">
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">{title}</p>
        <h3 className="text-xl font-semibold">{subtitle}</h3>
      </div>
      {helper && <p className="text-xs text-white/50 max-w-lg">{helper}</p>}
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

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">fabric admin console</p>
          <h2 className="text-2xl font-semibold">Command Centre • Token vs Mint</h2>
          <p className="text-sm text-white/60">
            Choose a lane below. Each segment exposes both the listing and approval functions for that workflow.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setActiveLane('token')}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition ${
              activeLane === 'token'
                ? 'bg-accent text-slate-950'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Token lane
          </button>
          <button
            type="button"
            onClick={() => setActiveLane('mint')}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition ${
              activeLane === 'mint'
                ? 'bg-accent text-slate-950'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            Mint lane
          </button>
          <button
            type="button"
            onClick={() => setActiveLane('list')}
            className={`px-6 py-2 rounded-xl text-sm font-semibold transition ${
              activeLane === 'list'
                ? 'bg-accent text-slate-950'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            List lane
          </button>
        </div>
      </div>

      {activeLane === 'token' && (
        <Section
          title="token lane"
          subtitle="Token access lifecycle"
          helper="Step 1: Review pending token access requests. Step 2: Approve or reject by referencing the requestId (network address)."
          cards={TOKEN_FUNCTIONS}
        />
      )}

      {activeLane === 'mint' && (
        <Section
          title="mint lane"
          subtitle="Supply authorization"
          helper="Step 1: Inspect the mint queue. Step 2: Approve or reject mint requests with the provided requestId."
          cards={MINT_FUNCTIONS}
        />
      )}

      {activeLane === 'list' && (
        <Section
          title="list lane"
          subtitle="Approved assets"
          helper="Audit which tokens are assigned and which mint requests have already been approved using the read-only endpoints."
          cards={LIST_FUNCTIONS}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
