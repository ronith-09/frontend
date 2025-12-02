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

const LANES = [
  {
    key: 'register',
    icon: '👥',
    title: 'Customer Registration',
    subtitle: 'Onboard new customers',
    helper: 'Register new customers and verify their account information.',
    functions: [
      {
        key: 'submitRegistration',
        title: 'Register New Customer',
        description: 'Create a new customer account in the system.',
        method: 'POST',
        endpoint: '/participant/register',
        fields: [
          { name: 'userId', label: 'Customer Username', placeholder: 'Enter username (e.g., alice)', required: true },
          { name: 'password', label: 'Password', placeholder: 'Create password (optional)', type: 'password' },
          {
            name: 'passwordHash',
            label: 'Security Code',
            placeholder: 'Pre-generated security code (if available)',
            helper: 'If provided, password field will be ignored'
          },
          { name: 'country', label: 'Country', defaultValue: 'US', placeholder: 'Country code (e.g., US, UK)' }
        ],
        buildRequest: values => ({
          data: cleanPayload({
            userId: values.userId,
            password: values.password,
            passwordHash: values.passwordHash,
            country: values.country
          })
        })
      },
      {
        key: 'participantExists',
        title: 'Check Customer Exists',
        description: 'Verify if a customer account already exists.',
        method: 'GET',
        endpoint: '/participant/exists',
        fields: [{ name: 'networkAddress', label: 'Account ID', required: true, placeholder: 'Enter account identifier' }],
        buildRequest: values => ({
          params: cleanPayload({ networkAddress: values.networkAddress })
        })
      }
    ]
  },
  {
    key: 'token',
    icon: '💰',
    title: 'Currency Access',
    subtitle: 'Manage currency permissions',
    helper: 'Request and manage access to different currency types for your bank.',
    functions: [
      {
        key: 'requestTokenRequest',
        title: 'Request Currency Access',
        description: 'Submit a request to access a new currency type.',
        method: 'POST',
        endpoint: '/token-request',
        fields: [
          { name: 'userId', label: 'Bank User ID', required: true, placeholder: 'Your bank user ID' },
          { name: 'name', label: 'Bank Name', required: true, placeholder: 'Your bank name' },
          { name: 'networkAddress', label: 'Bank Account ID', placeholder: 'Your bank account identifier' },
          { name: 'password', label: 'Password', type: 'password', placeholder: 'Your password' },
          {
            name: 'passwordHash',
            label: 'Security Code',
            placeholder: 'Pre-generated security code',
            helper: 'Optional alternative to password'
          },
          { name: 'country', label: 'Country', defaultValue: 'US', placeholder: 'Country code' }
        ],
        buildRequest: values => ({
          data: cleanPayload({
            userId: values.userId,
            name: values.name,
            networkAddress: values.networkAddress,
            password: values.password,
            passwordHash: values.passwordHash,
            country: values.country
          })
        })
      },
      {
        key: 'getTokenAccess',
        title: 'Check Currency Access',
        description: 'Verify your access permissions for a specific currency.',
        method: 'POST',
        endpoint: '/bank/get-token-access',
        fields: [
          { name: 'userId', label: 'Bank User ID', required: true, placeholder: 'Your bank user ID' },
          { name: 'networkAddress', label: 'Bank Account ID', required: true, placeholder: 'Your bank account identifier' },
          { name: 'tokenId', label: 'Currency ID', required: true, placeholder: 'Currency identifier (e.g., USD_COIN)' }
        ],
        buildRequest: values => ({
          data: cleanPayload({
            userId: values.userId,
            networkAddress: values.networkAddress,
            tokenId: values.tokenId
          })
        })
      }
    ]
  },
  {
    key: 'mint',
    icon: '💵',
    title: 'Issue Funds',
    subtitle: 'Add funds to accounts',
    helper: 'Submit requests to issue new funds and check account balances.',
    functions: [
      {
        key: 'requestMintCoins',
        title: 'Request to Issue Funds',
        description: 'Submit a request to add funds to an account.',
        method: 'POST',
        endpoint: '/mint-request',
        fields: [
          { name: 'userId', label: 'Bank User ID', required: true, placeholder: 'Your bank user ID' },
          { name: 'networkAddress', label: 'Bank Account ID', required: true, placeholder: 'Your bank account identifier' },
          { name: 'amount', label: 'Amount', required: true, type: 'number', placeholder: 'Amount to issue (e.g., 1000)' },
          { name: 'password', label: 'Password', type: 'password', placeholder: 'Your password for verification' }
        ],
        buildRequest: values => ({
          data: cleanPayload({
            userId: values.userId,
            networkAddress: values.networkAddress,
            amount: values.amount,
            password: values.password
          })
        })
      },
      {
        key: 'getWalletInfo',
        title: 'View Account Balance',
        description: 'Check the current balance and details of an account.',
        method: 'GET',
        endpoint: '/bank/wallet',
        fields: [
          { name: 'userId', label: 'Bank User ID', required: true, placeholder: 'Bank user ID' },
          { name: 'networkAddress', label: 'Account ID', required: true, placeholder: 'Account identifier' },
          { name: 'password', label: 'Password', type: 'password', placeholder: 'Password (optional)' },
          { name: 'passwordHash', label: 'Security Code', placeholder: 'Security code (preferred if available)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            userId: values.userId,
            networkAddress: values.networkAddress,
            password: values.password,
            passwordHash: values.passwordHash
          })
        })
      }
    ]
  },
  {
    key: 'transfer',
    icon: '🔄',
    title: 'Transfer Approvals',
    subtitle: 'Review and approve transfers',
    helper: 'View transfer requests and approve transactions between accounts.',
    functions: [
      {
        key: 'viewTransferRequestsForOwner',
        title: 'View Sender Transfer Requests',
        description: 'View transfer requests where you are the sender.',
        method: 'GET',
        endpoint: '/transfer-requests/owner',
        fields: [
          { name: 'ownerID', label: 'Sender Account ID', required: true, placeholder: 'Sender account identifier' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional, defaults to system)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({ ownerID: values.ownerID, userId: values.userId })
        })
      },
      {
        key: 'viewTransferRequestsForReceiver',
        title: 'View Receiver Transfer Requests',
        description: 'View transfer requests where you are the receiver.',
        method: 'GET',
        endpoint: '/transfer-requests/receiver',
        fields: [
          { name: 'receiverID', label: 'Receiver Account ID', required: true, placeholder: 'Receiver account identifier' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({ receiverID: values.receiverID, userId: values.userId })
        })
      },
      {
        key: 'approveTransferByOwner',
        title: 'Approve Transfer (Sender)',
        description: 'Approve a pending transfer as the sender.',
        method: 'POST',
        endpoint: '/transfer-requests/:transferId/approve-owner',
        fields: [
          { name: 'transferId', label: 'Transfer Request ID', required: true, placeholder: 'Enter transfer request ID' },
          { name: 'approver', label: 'Approver Account ID', placeholder: 'Your account ID for approval' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => {
          if (!values.transferId) {
            throw new Error('Transfer Request ID is required');
          }
          return {
            url: `/transfer-requests/${encodeURIComponent(values.transferId)}/approve-owner`,
            data: cleanPayload({ approver: values.approver, userId: values.userId })
          };
        }
      },
      {
        key: 'approveTransferByReceiverOwner',
        title: 'Approve Transfer (Receiver)',
        description: 'Approve a pending transfer as the receiver.',
        method: 'POST',
        endpoint: '/transfer-requests/:transferId/approve-receiver-owner',
        fields: [
          { name: 'transferId', label: 'Transfer Request ID', required: true, placeholder: 'Enter transfer request ID' },
          { name: 'approver', label: 'Approver Account ID', placeholder: 'Your account ID for approval' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => {
          if (!values.transferId) {
            throw new Error('Transfer Request ID is required');
          }
          return {
            url: `/transfer-requests/${encodeURIComponent(values.transferId)}/approve-receiver-owner`,
            data: cleanPayload({ approver: values.approver, userId: values.userId })
          };
        }
      }
    ]
  },
  {
    key: 'list',
    icon: '📋',
    title: 'Customer Records',
    subtitle: 'View approved customers and transactions',
    helper: 'Access records of approved customers and their transaction history.',
    functions: [
      {
        key: 'listApprovedParticipants',
        title: 'View Approved Customers',
        description: 'List all customers that have been approved for banking services.',
        method: 'GET',
        endpoint: '/bank/participants/approved',
        fields: [
          { name: 'networkAddress', label: 'Customer Account ID', placeholder: 'Filter by account ID (optional)' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({ networkAddress: values.networkAddress, userId: values.userId })
        })
      },
      {
        key: 'listApprovedParticipantMintRequests',
        title: 'View Approved Fund Requests',
        description: 'View all approved customer fund issuance requests.',
        method: 'GET',
        endpoint: '/participant-mint-requests/approved',
        fields: [
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            userId: values.userId
          })
        })
      },
      {
        key: 'listTokenToTokenTransferHistory',
        title: 'View Currency Transfer History',
        description: 'View the history of transfers for a specific currency.',
        method: 'GET',
        endpoint: '/token-transfer-history',
        fields: [
          { name: 'tokenID', label: 'Currency ID', required: true, placeholder: 'Currency identifier' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            tokenID: values.tokenID,
            userId: values.userId
          })
        })
      },
      {
        key: 'listParticipantTransferHistory',
        title: 'View Customer Transaction History',
        description: 'View the complete transaction history for a specific customer.',
        method: 'GET',
        endpoint: '/participant/transfer-history',
        fields: [
          { name: 'participantID', label: 'Customer ID', required: true, placeholder: 'Customer account identifier' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            participantID: values.participantID,
            userId: values.userId
          })
        })
      }
    ]
  },
  {
    key: 'tokenTransfer',
    icon: '↔️',
    title: 'Currency Exchange',
    subtitle: 'Transfer between currencies',
    helper: 'Initiate and approve transfers between different currency types.',
    functions: [
      {
        key: 'createTokenTransferRequest',
        title: 'Create Currency Transfer',
        description: 'Initiate a transfer between two different currencies.',
        method: 'POST',
        endpoint: '/token-transfer-request',
        fields: [
          { name: 'senderTokenID', label: 'From Currency', required: true, placeholder: 'Source currency ID' },
          { name: 'receiverTokenID', label: 'To Currency', required: true, placeholder: 'Destination currency ID' },
          { name: 'senderOwnerAddress', label: 'Sender Account ID', required: true, placeholder: 'Your account identifier' },
          { name: 'amount', label: 'Amount', required: true, type: 'number', placeholder: 'Amount to transfer' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => ({
          data: cleanPayload({
            senderTokenID: values.senderTokenID,
            receiverTokenID: values.receiverTokenID,
            senderOwnerAddress: values.senderOwnerAddress,
            amount: values.amount,
            userId: values.userId
          })
        })
      },
      {
        key: 'viewPendingTokenTransferRequests',
        title: 'View Pending Currency Transfers',
        description: 'List pending transfer requests for a specific currency.',
        method: 'GET',
        endpoint: '/token-transfer-requests/pending',
        fields: [
          { name: 'receiverTokenID', label: 'Receiving Currency', required: true, placeholder: 'Currency receiving funds' },
          { name: 'receiverOwnerAddress', label: 'Receiver Account ID', required: true, placeholder: 'Receiver account identifier' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            receiverTokenID: values.receiverTokenID,
            receiverOwnerAddress: values.receiverOwnerAddress,
            userId: values.userId
          })
        })
      },
      {
        key: 'approveTokenTransferRequest',
        title: 'Approve Currency Transfer',
        description: 'Approve a pending currency transfer request.',
        method: 'POST',
        endpoint: '/token-transfer-requests/:requestId/approve',
        fields: [
          { name: 'requestId', label: 'Transfer Request ID', required: true, placeholder: 'Enter request ID' },
          { name: 'receiverOwnerAddress', label: 'Receiver Account ID', required: true, placeholder: 'Receiver account identifier' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => {
          if (!values.requestId) {
            throw new Error('Transfer Request ID is required');
          }
          return {
            url: `/token-transfer-requests/${encodeURIComponent(values.requestId)}/approve`,
            data: cleanPayload({
              receiverOwnerAddress: values.receiverOwnerAddress,
              userId: values.userId
            })
          };
        }
      },
      {
        key: 'listTokenToTokenTransferHistory',
        title: 'View Transfer History',
        description: 'View historical currency transfers for a specific currency.',
        method: 'GET',
        endpoint: '/token-transfer-history',
        fields: [
          { name: 'tokenID', label: 'Currency ID', required: true, placeholder: 'Currency identifier' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            tokenID: values.tokenID,
            userId: values.userId
          })
        })
      }
    ]
  },
  {
    key: 'customer',
    icon: '✅',
    title: 'Customer Onboarding',
    subtitle: 'Approve customer registrations',
    helper: 'Review and approve new customer registration requests.',
    functions: [
      {
        key: 'viewPendingCustomerRegistrations',
        title: 'View Pending Registrations',
        description: 'List all pending customer registration requests.',
        method: 'GET',
        endpoint: '/bank/customer-registrations/pending',
        fields: [
          { name: 'tokenID', label: 'Currency ID', required: true, placeholder: 'Currency identifier' },
          { name: 'ownerNetworkAddress', label: 'Bank Account ID', placeholder: 'Your bank account ID' },
          { name: 'customerAddress', label: 'Customer Account ID', placeholder: 'Customer account ID (optional filter)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            tokenID: values.tokenID,
            ownerNetworkAddress: values.ownerNetworkAddress,
            customerAddress: values.customerAddress
          })
        })
      },
      {
        key: 'listApprovedCustomers',
        title: 'View Approved Customers',
        description: 'List all customers that have been approved for your currency.',
        method: 'GET',
        endpoint: '/bank/customer-registrations/approved',
        fields: [
          { name: 'tokenID', label: 'Currency ID', required: true, placeholder: 'Currency identifier' },
          { name: 'ownerNetworkAddress', label: 'Bank Account ID', required: true, placeholder: 'Your bank account ID' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'Bank user ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            tokenID: values.tokenID,
            ownerNetworkAddress: values.ownerNetworkAddress,
            userId: values.userId
          })
        })
      },
      {
        key: 'approveCustomerRegistration',
        title: 'Approve/Reject Registration',
        description: 'Approve or reject a customer registration request.',
        method: 'POST',
        endpoint: '/bank/customer-registrations/:requestId/approve',
        fields: [
          { name: 'requestId', label: 'Registration Request ID', required: true, placeholder: 'Registration request ID' },
          { name: 'ownerNetworkAddress', label: 'Bank Account ID', required: true, placeholder: 'Your bank account ID' },
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
          if (!values.requestId) {
            throw new Error('Registration Request ID is required');
          }
          return {
            url: `/bank/customer-registrations/${encodeURIComponent(values.requestId)}/approve`,
            data: cleanPayload({
              ownerNetworkAddress: values.ownerNetworkAddress,
              status: values.status
            })
          };
        }
      }
    ]
  },
  {
    key: 'customerMint',
    icon: '💳',
    title: 'Customer Fund Requests',
    subtitle: 'Approve customer fund requests',
    helper: 'Review and approve requests from customers to add funds to their accounts.',
    functions: [
      {
        key: 'viewPendingCustomerMintRequests',
        title: 'View Pending Fund Requests',
        description: 'View all pending customer requests to add funds.',
        method: 'GET',
        endpoint: '/bank/customer-mint-requests/pending',
        fields: [
          { name: 'tokenID', label: 'Currency ID', required: true, placeholder: 'Currency identifier' },
          { name: 'ownerNetworkAddress', label: 'Bank Account ID', placeholder: 'Your bank account ID' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            tokenID: values.tokenID,
            ownerNetworkAddress: values.ownerNetworkAddress
          })
        })
      },
      {
        key: 'approveCustomerMint',
        title: 'Approve/Reject Fund Request',
        description: 'Approve or reject a customer fund request.',
        method: 'POST',
        endpoint: '/bank/customer-mint-requests/:requestId/approve',
        fields: [
          { name: 'requestId', label: 'Fund Request ID', required: true, placeholder: 'Request ID to approve/reject' },
          { name: 'ownerNetworkAddress', label: 'Bank Account ID', required: true, placeholder: 'Your bank account ID' },
          { name: 'tokenID', label: 'Currency ID', required: true, placeholder: 'Currency identifier' },
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
          if (!values.requestId) {
            throw new Error('Fund Request ID is required');
          }
          return {
            url: `/bank/customer-mint-requests/${encodeURIComponent(values.requestId)}/approve`,
            data: cleanPayload({
              ownerNetworkAddress: values.ownerNetworkAddress,
              status: values.status,
              tokenID: values.tokenID
            })
          };
        }
      }
    ]
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

const LaneSelector = ({ activeLane, onSelect }) => (
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
    {LANES.map(lane => (
      <button
        key={lane.key}
        type="button"
        onClick={() => onSelect(lane.key)}
        className={`p-4 rounded-xl text-left transition border ${
          activeLane === lane.key
            ? 'bg-accent/10 border-accent text-white'
            : 'bg-white/5 border-white/5 text-white/70 hover:bg-white/10 hover:border-white/10'
        }`}
      >
        <div className="text-2xl mb-2">{lane.icon}</div>
        <div className="text-sm font-semibold">{lane.title}</div>
      </button>
    ))}
  </div>
);

const LaneSection = ({ lane }) => (
  <div className="glass-panel p-6 space-y-6 border border-white/5">
    <div className="flex items-start gap-4">
      <div className="text-4xl">{lane.icon}</div>
      <div className="flex-1">
        <h3 className="text-2xl font-semibold mb-1">{lane.subtitle}</h3>
        {lane.helper && <p className="text-sm text-white/60">{lane.helper}</p>}
      </div>
    </div>
    <div className="grid gap-6 lg:grid-cols-2">
      {lane.functions.map(fn => (
        <FunctionCard key={fn.key} {...fn} />
      ))}
    </div>
  </div>
);

const BankDashboard = () => {
  const [latestRegistration, setLatestRegistration] = useState(() => getStoredRegistrationSnapshot());
  const [activeLane, setActiveLane] = useState('register');
  const [stats, setStats] = useState({
    customers: 0,
    pendingApprovals: 0,
    activeCurrencies: 0,
    transactions: 0
  });

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

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          participants, 
          currencies, 
          pendingTokenReqs,
          pendingMintReqs,
          pendingCustomerRegs,
          pendingCustomerMints,
          tokenTransferHistory,
          participantTransferHistory
        ] = await Promise.all([
          safeGet('/bank/participants/approved', []),
          safeGet('/bank/view-all-tokens', []),
          safeGet('/token-requests/pending', []),
          safeGet('/mint-requests/pending', []),
          safeGet('/bank/customer-registrations/pending', []),
          safeGet('/bank/customer-mint-requests/pending', []),
          safeGet('/token-transfer-history', []),
          safeGet('/participant/transfer-history', [])
        ]);
        
        // Calculate total pending approvals
        const totalPending = 
          (Array.isArray(pendingTokenReqs) ? pendingTokenReqs.length : 0) +
          (Array.isArray(pendingMintReqs) ? pendingMintReqs.length : 0) +
          (Array.isArray(pendingCustomerRegs) ? pendingCustomerRegs.length : 0) +
          (Array.isArray(pendingCustomerMints) ? pendingCustomerMints.length : 0);
        
        // Calculate today's transactions
        const today = new Date().toDateString();
        const todayTransactions = [
          ...(Array.isArray(tokenTransferHistory) ? tokenTransferHistory : []),
          ...(Array.isArray(participantTransferHistory) ? participantTransferHistory : [])
        ].filter(tx => {
          if (!tx.timestamp) return false;
          const txDate = new Date(tx.timestamp).toDateString();
          return txDate === today;
        }).length;
        
        setStats({
          customers: Array.isArray(participants) ? participants.length : 0,
          pendingApprovals: totalPending,
          activeCurrencies: Array.isArray(currencies) ? currencies.length : 0,
          transactions: todayTransactions
        });
      } catch (error) {
        console.warn('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  const currentLane = LANES.find(lane => lane.key === activeLane) || LANES[0];

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 space-y-4 border border-white/5">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">Bank Operations Center</p>
          <h2 className="text-3xl font-bold mt-1">International Transaction Management</h2>
          <p className="text-sm text-white/60 mt-2">
            Manage customer accounts, approve transactions, and oversee international fund transfers.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon="👥" label="Total Customers" value={stats.customers.toLocaleString()} subtext="Approved accounts" />
        <StatCard icon="⏳" label="Pending Approvals" value={stats.pendingApprovals.toLocaleString()} subtext="Awaiting review" />
        <StatCard icon="💰" label="Active Currencies" value={stats.activeCurrencies.toLocaleString()} subtext="Available for trading" />
        <StatCard icon="📊" label="Transactions Today" value={stats.transactions.toLocaleString()} subtext="Completed transfers" />
      </div>

      {latestRegistration?.wallet_created && (
        <div className="glass-panel border-2 border-accent/30 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔑</span>
            <p className="text-sm uppercase tracking-wide text-accent font-semibold">Recent Registration</p>
          </div>
          <p className="text-sm text-white/70">Use these credentials when performing operations in the sections below.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs uppercase text-white/40 mb-1">Username</p>
              <p className="font-mono text-sm text-white break-all">{latestRegistration.username}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs uppercase text-white/40 mb-1">Role</p>
              <p className="text-sm text-white">{latestRegistration.role === 'bank' ? 'Bank' : latestRegistration.role === 'customer' ? 'Customer' : latestRegistration.role}</p>
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
            Saved locally {latestRegistration.timestamp ? `• ${new Date(latestRegistration.timestamp).toLocaleString()}` : ''}
          </p>
        </div>
      )}

      <div className="glass-panel p-6 space-y-6 border border-white/5">
        <div>
          <h3 className="text-xl font-semibold mb-1">Select Operation Category</h3>
          <p className="text-sm text-white/60">Choose a category to view and perform related banking operations.</p>
        </div>
        <LaneSelector activeLane={activeLane} onSelect={setActiveLane} />
      </div>

      <LaneSection lane={currentLane} />
    </div>
  );
};

export default BankDashboard;
