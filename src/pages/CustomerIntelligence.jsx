import { useEffect, useState } from 'react';
import { FunctionCard } from '../components';
import { safeGet } from '../services/apiClient';

const cleanPayload = payload =>
  Object.entries(payload).reduce((acc, [key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});

const PARTICIPANT_FUNCTIONS = [
  {
    key: 'viewAllTokens',
    icon: '💰',
    title: 'View Available Currencies',
    description: 'Browse all available currencies for international transactions.',
    method: 'GET',
    endpoint: '/bank/view-all-tokens',
    fields: [],
    buildRequest: () => ({})
  },
  {
    key: 'registerCustomer',
    icon: '✅',
    title: 'Register for Currency',
    description: 'Register your account to access a specific currency.',
    method: 'POST',
    endpoint: '/bank/register-customer',
    fields: [
      { name: 'networkAddress', label: 'Your Account ID', required: true, placeholder: 'Your account identifier' },
      { name: 'name', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
      { name: 'passwordHash', label: 'Security Code', required: true, placeholder: 'Your security code' },
      { name: 'tokenID', label: 'Currency', required: true, placeholder: 'Currency ID to register for' }
    ],
    buildRequest: values => ({
      data: cleanPayload({
        networkAddress: values.networkAddress,
        name: values.name,
        passwordHash: values.passwordHash,
        tokenID: values.tokenID
      })
    })
  },
  {
    key: 'customerRequestMint',
    icon: '💵',
    title: 'Request Funds',
    description: 'Submit a request to add funds to your account.',
    method: 'POST',
    endpoint: '/bank/request-mint',
    fields: [
      { name: 'networkAddress', label: 'Account ID', required: true, placeholder: 'Your account identifier' },
      { name: 'tokenID', label: 'Currency', required: true, placeholder: 'Currency ID' },
      { name: 'amount', label: 'Amount', required: true, type: 'number', placeholder: 'Amount to request' },
      { name: 'passwordHash', label: 'Security Code', required: true, placeholder: 'Your security code' },
      { name: 'reason', label: 'Reason', placeholder: 'Reason for fund request (optional)' }
    ],
    buildRequest: values => ({
      data: cleanPayload({
        networkAddress: values.networkAddress,
        tokenID: values.tokenID,
        amount: values.amount,
        passwordHash: values.passwordHash,
        reason: values.reason
      })
    })
  },
  {
    key: 'createTransferRequest',
    icon: '🔄',
    title: 'Transfer Funds',
    description: 'Initiate an international fund transfer to another customer.',
    method: 'POST',
    endpoint: '/transfer-request',
    fields: [
      { name: 'senderParticipantID', label: 'Your Customer ID', required: true, placeholder: 'Your customer identifier' },
      { name: 'receiverParticipantID', label: 'Recipient Customer ID', required: true, placeholder: 'Recipient identifier' },
      {
        name: 'senderTokenTransferID',
        label: 'Your Transfer ID',
        required: true,
        placeholder: 'Your transfer account ID'
      },
      {
        name: 'receiverTokenTransferID',
        label: 'Recipient Transfer ID',
        required: true,
        placeholder: 'Recipient transfer account ID'
      },
      { name: 'tokenID', label: 'Currency', required: true, placeholder: 'Currency to transfer' },
      { name: 'amount', label: 'Amount', required: true, type: 'number', placeholder: 'Amount to transfer' }
    ],
    buildRequest: values => ({
      data: cleanPayload({
        senderParticipantID: values.senderParticipantID,
        receiverParticipantID: values.receiverParticipantID,
        senderTokenTransferID: values.senderTokenTransferID,
        receiverTokenTransferID: values.receiverTokenTransferID,
        tokenID: values.tokenID,
        amount: values.amount
      })
    })
  },
  {
    key: 'viewCustomerWallet',
    icon: '💼',
    title: 'View Account Balance',
    description: 'Check your current account balance and details.',
    method: 'GET',
    endpoint: '/customer/wallet',
    fields: [
      { name: 'userId', label: 'Username', placeholder: 'Your username (optional)' },
      { name: 'networkAddress', label: 'Account ID', required: true, placeholder: 'Your account identifier' },
      { name: 'tokenID', label: 'Currency', required: true, placeholder: 'Currency ID to check' },
      { name: 'passwordHash', label: 'Security Code', required: true, placeholder: 'Your security code' }
    ],
    buildRequest: values => ({
      params: cleanPayload({
        userId: values.userId,
        networkAddress: values.networkAddress,
        tokenID: values.tokenID,
        passwordHash: values.passwordHash
      })
    })
  },
  {
    key: 'listParticipantTransferHistory',
    icon: '📊',
    title: 'Transaction History',
    description: 'View your complete transaction history.',
    method: 'GET',
    endpoint: '/participant/transfer-history',
    fields: [
      { name: 'userId', label: 'Username', placeholder: 'Your username (optional)' },
      { name: 'networkAddress', label: 'Account ID', placeholder: 'Your account identifier (optional)' },
      { name: 'passwordHash', label: 'Security Code', placeholder: 'Your security code (optional)' }
    ],
    buildRequest: values => ({
      params: cleanPayload({
        userId: values.userId,
        networkAddress: values.networkAddress,
        passwordHash: values.passwordHash
      })
    })
  }
];

const getStoredRegistrationSnapshot = () => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem('latestRegistrationCredentials');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const QuickActionCard = ({ icon, title, description, onClick }) => (
  <button
    onClick={onClick}
    className="glass-panel p-6 text-left transition border border-white/5 hover:border-accent/40 hover:bg-accent/5 group"
  >
    <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-lg font-semibold mb-1">{title}</h3>
    <p className="text-sm text-white/60">{description}</p>
  </button>
);

const StatCard = ({ icon, label, value, subtext }) => (
  <div className="glass-panel p-6 border border-white/5">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-xs uppercase tracking-wide text-white/50 mb-1">{label}</p>
        <p className="text-3xl font-bold text-white mb-1">{value}</p>
        {subtext && <p className="text-xs text-white/40">{subtext}</p>}
      </div>
      <div className="text-3xl opacity-20">{icon}</div>
    </div>
  </div>
);

const ParticipantDashboard = () => {
  const [latestRegistration, setLatestRegistration] = useState(() => getStoredRegistrationSnapshot());
  const [selectedFunction, setSelectedFunction] = useState(null);
  const [walletBalance, setWalletBalance] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncSnapshot = () => setLatestRegistration(getStoredRegistrationSnapshot());
    const handleCustomEvent = event => {
      if (event?.detail) {
        setLatestRegistration(event.detail);
      } else {
        syncSnapshot();
      }
    };

    window.addEventListener('storage', syncSnapshot);
    window.addEventListener('latest-registration-credentials', handleCustomEvent);
    syncSnapshot();

    return () => {
      window.removeEventListener('storage', syncSnapshot);
      window.removeEventListener('latest-registration-credentials', handleCustomEvent);
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 space-y-4 border border-white/5">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">Customer Portal</p>
          <h2 className="text-3xl font-bold mt-1">International Banking Services</h2>
          <p className="text-sm text-white/60 mt-2">
            Access your accounts, transfer funds internationally, and manage your transactions securely.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          icon="💼" 
          label="Account Balance" 
          value={walletBalance ? `$${walletBalance.toLocaleString()}` : '—'} 
          subtext="Available funds" 
        />
        <StatCard 
          icon="⏳" 
          label="Pending Requests" 
          value="0" 
          subtext="Awaiting approval" 
        />
        <StatCard 
          icon="✅" 
          label="Completed Today" 
          value="0" 
          subtext="Successful transfers" 
        />
      </div>

      {latestRegistration?.wallet_created && (
        <div className="glass-panel border-2 border-accent/30 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔑</span>
            <p className="text-sm uppercase tracking-wide text-accent font-semibold">Your Account Information</p>
          </div>
          <p className="text-sm text-white/70">Use these credentials when performing transactions.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs uppercase text-white/40 mb-1">Username</p>
              <p className="font-mono text-sm text-white break-all">{latestRegistration.username}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs uppercase text-white/40 mb-1">Account Type</p>
              <p className="text-sm text-white">{latestRegistration.role === 'customer' ? 'Customer Account' : latestRegistration.role}</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs uppercase text-white/40 mb-1">Account ID</p>
            <p className="font-mono text-sm break-all text-accent">{latestRegistration.network_address || '—'}</p>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs uppercase text-white/40 mb-1">Security Code</p>
            <p className="font-mono text-sm break-all text-accentSecondary">{latestRegistration.password_hash || '—'}</p>
          </div>
          <p className="text-xs text-white/40">
            Last updated {latestRegistration.timestamp ? `• ${new Date(latestRegistration.timestamp).toLocaleString()}` : ''}
          </p>
        </div>
      )}

      <div>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">Quick Actions</h3>
          <p className="text-sm text-white/60">Common operations for managing your international transactions</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <QuickActionCard
            icon="🔄"
            title="Transfer Funds"
            description="Send money internationally"
            onClick={() => {
              const transferFunc = PARTICIPANT_FUNCTIONS.find(f => f.key === 'createTransferRequest');
              setSelectedFunction(transferFunc);
              document.getElementById('operations-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <QuickActionCard
            icon="💵"
            title="Request Funds"
            description="Add funds to your account"
            onClick={() => {
              const requestFunc = PARTICIPANT_FUNCTIONS.find(f => f.key === 'customerRequestMint');
              setSelectedFunction(requestFunc);
              document.getElementById('operations-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
          <QuickActionCard
            icon="📊"
            title="View History"
            description="Check transaction history"
            onClick={() => {
              const historyFunc = PARTICIPANT_FUNCTIONS.find(f => f.key === 'listParticipantTransferHistory');
              setSelectedFunction(historyFunc);
              document.getElementById('operations-section')?.scrollIntoView({ behavior: 'smooth' });
            }}
          />
        </div>
      </div>

      <div id="operations-section">
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">All Services</h3>
          <p className="text-sm text-white/60">Complete list of available banking operations</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {PARTICIPANT_FUNCTIONS.map(fn => (
            <div key={fn.key} className={selectedFunction?.key === fn.key ? 'ring-2 ring-accent rounded-2xl' : ''}>
              <FunctionCard {...fn} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ParticipantDashboard;
