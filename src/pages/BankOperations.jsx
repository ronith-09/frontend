import { useEffect, useState } from 'react';
import { FunctionCard } from '../components';
import { safeGet } from '../services/apiClient';
import client from '../services/apiClient';

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
    subtitle: 'Manage Customer Onboarding',
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
          { name: 'country', label: 'Country Code', defaultValue: 'US', placeholder: 'e.g., US, UK, CA' }
        ],
        buildRequest: values => ({
          data: cleanPayload({
            userId: values.userId,
            password: values.password,
            country: values.country
          })
        })
      },
      {
        key: 'participantExists',
        title: 'Verify Customer Account',
        description: 'Check if a customer account already exists in the system.',
        method: 'GET',
        endpoint: '/participant/exists',
        fields: [{ name: 'networkAddress', label: 'Account Number', required: true, placeholder: 'Enter account number' }],
        buildRequest: values => ({
          params: cleanPayload({ networkAddress: values.networkAddress })
        })
      },
      {
        key: 'registerBankCustomer',
        title: 'Register Customer to Currency',
        description: 'Register an approved customer to access a specific currency token.',
        method: 'POST',
        endpoint: '/bank/register-customer',
        fields: [
          { name: 'networkAddress', label: 'Customer Account Number', required: true, placeholder: 'Enter customer account number' },
          { name: 'name', label: 'Customer Name', required: true, placeholder: 'Enter customer full name' },
          { name: 'tokenID', label: 'Currency Token ID', required: true, placeholder: 'Enter currency token ID (e.g., USD, EUR)' }
        ],
        buildRequest: values => ({
          data: cleanPayload({
            networkAddress: values.networkAddress,
            name: values.name,
            tokenID: values.tokenID
          })
        })
      }
    ]
  },
  {
    key: 'token',
    icon: '💰',
    title: 'Currency Access',
    subtitle: 'Manage Currency Permissions',
    helper: 'Request and verify access to different currencies for your institution.',
    functions: [
      {
        key: 'requestTokenRequest',
        title: 'Request Currency Access',
        description: 'Submit a request to enable a new currency for your institution.',
        method: 'POST',
        endpoint: '/token-request',
        fields: [
          { name: 'userId', label: 'Bank User ID', required: true, placeholder: 'Your institution user ID' },
          { name: 'name', label: 'Institution Name', required: true, placeholder: 'Your institution name' },
          { name: 'networkAddress', label: 'Institution Account Number', placeholder: 'Your account number' },
          { name: 'password', label: 'Password', type: 'password', placeholder: 'Your password' },
          { name: 'country', label: 'Country Code', defaultValue: 'US', placeholder: 'e.g., US, UK, CA' },
          { name: 'currency', label: 'Currency Code', required: true, placeholder: 'e.g., USD, EUR, GBP' }
        ],
        buildRequest: values => ({
          data: cleanPayload({
            userId: values.userId,
            name: values.name,
            networkAddress: values.networkAddress,
            password: values.password,
            country: values.country,
            currency: values.currency
          })
        })
      },
      {
        key: 'getTokenAccess',
        title: 'Check Currency Access Status',
        description: 'Verify if your institution has access to a specific currency.',
        method: 'POST',
        endpoint: '/bank/get-token-access',
        fields: [
          { name: 'userId', label: 'Bank User ID', required: true, placeholder: 'Your user ID' },
          { name: 'networkAddress', label: 'Account Number', required: true, placeholder: 'Your account number' },
          { name: 'tokenId', label: 'Currency Code', required: true, placeholder: 'e.g., USD, EUR, GBP' }
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
    title: 'Fund Management',
    subtitle: 'Issue and Manage Funds',
    helper: 'Request fund issuance and check account balances.',
    functions: [
      {
        key: 'requestMintCoins',
        title: 'Request Fund Issuance',
        description: 'Submit a request to issue funds to an account.',
        method: 'POST',
        endpoint: '/mint-request',
        fields: [
          { name: 'userId', label: 'Bank User ID', required: true, placeholder: 'Your user ID' },
          { name: 'networkAddress', label: 'Account Number', required: true, placeholder: 'Your account number' },
          { name: 'amount', label: 'Amount', required: true, type: 'number', placeholder: 'Enter amount (e.g., 1000)' },
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
        title: 'Check Account Balance',
        description: 'View the current balance and details of an account.',
        method: 'GET',
        endpoint: '/bank/wallet',
        fields: [
          { name: 'userId', label: 'Bank User ID', required: true, placeholder: 'User ID' },
          { name: 'networkAddress', label: 'Account Number', required: true, placeholder: 'Account number' },
          { name: 'password', label: 'Password', type: 'password', placeholder: 'Password (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            userId: values.userId,
            networkAddress: values.networkAddress,
            password: values.password
          })
        })
      }
    ]
  },
  {
    key: 'transfer',
    icon: '🔄',
    title: 'Transfer Approvals',
    subtitle: 'Review and Approve Transfers',
    helper: 'View pending transfer requests and approve transactions.',
    functions: [
      {
        key: 'viewTransferRequestsForOwner',
        title: 'View Outgoing Transfer Requests',
        description: 'View transfer requests where specified account is the sender.',
        method: 'GET',
        endpoint: '/transfer-requests/owner',
        fields: [
          { name: 'ownerID', label: 'Sender Account Number', required: true, placeholder: 'Sender account number' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({ ownerID: values.ownerID, userId: values.userId })
        })
      },
      {
        key: 'viewTransferRequestsForReceiver',
        title: 'View Incoming Transfer Requests',
        description: 'View transfer requests where specified account is the receiver.',
        method: 'GET',
        endpoint: '/transfer-requests/receiver',
        fields: [
          { name: 'receiverID', label: 'Receiver Account Number', required: true, placeholder: 'Receiver account number' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({ receiverID: values.receiverID, userId: values.userId })
        })
      },
      {
        key: 'approveTransferByOwner',
        title: 'Approve Transfer (As Sender)',
        description: 'Approve a pending transfer request as the sending party.',
        method: 'POST',
        endpoint: '/transfer-requests/:transferId/approve-owner',
        fields: [
          { name: 'transferId', label: 'Transfer Request ID', required: true, placeholder: 'Enter transfer request ID' },
          { name: 'approver', label: 'Approver Account Number', placeholder: 'Your account number' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
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
        title: 'Approve Transfer (As Receiver)',
        description: 'Approve a pending transfer request as the receiving party.',
        method: 'POST',
        endpoint: '/transfer-requests/:transferId/approve-receiver-owner',
        fields: [
          { name: 'transferId', label: 'Transfer Request ID', required: true, placeholder: 'Enter transfer request ID' },
          { name: 'approver', label: 'Approver Account Number', placeholder: 'Your account number' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
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
    subtitle: 'View Customer Data',
    helper: 'Access records of approved customers and their transaction history.',
    functions: [
      {
        key: 'listApprovedParticipants',
        title: 'View Approved Customers',
        description: 'List all customers approved for banking services.',
        method: 'GET',
        endpoint: '/bank/participants/approved',
        fields: [
          { name: 'networkAddress', label: 'Account Number (Filter)', placeholder: 'Filter by account number (optional)' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({ networkAddress: values.networkAddress, userId: values.userId })
        })
      },
      {
        key: 'listApprovedParticipantMintRequests',
        title: 'View Approved Fund Issuance',
        description: 'View all approved fund issuance requests.',
        method: 'GET',
        endpoint: '/participant-mint-requests/approved',
        fields: [
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
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
          { name: 'tokenID', label: 'Currency Code', required: true, placeholder: 'e.g., USD, EUR, GBP' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
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
        description: 'View complete transaction history for a specific customer.',
        method: 'GET',
        endpoint: '/participant/transfer-history',
        fields: [
          { name: 'participantID', label: 'Customer Account Number', required: true, placeholder: 'Customer account number' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
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
    subtitle: 'Cross-Currency Transfers',
    helper: 'Manage transfers between different currencies.',
    functions: [
      {
        key: 'createTokenTransferRequest',
        title: 'Create Currency Exchange',
        description: 'Initiate a transfer between two different currencies.',
        method: 'POST',
        endpoint: '/token-transfer-request',
        fields: [
          { name: 'senderTokenID', label: 'From Currency', required: true, placeholder: 'Source currency code' },
          { name: 'receiverTokenID', label: 'To Currency', required: true, placeholder: 'Destination currency code' },
          { name: 'senderOwnerAddress', label: 'Sender Account Number', required: true, placeholder: 'Your account number' },
          { name: 'amount', label: 'Amount', required: true, type: 'number', placeholder: 'Amount to transfer' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
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
        title: 'View Pending Currency Exchanges',
        description: 'List pending currency exchange requests.',
        method: 'GET',
        endpoint: '/token-transfer-requests/pending',
        fields: [
          { name: 'receiverTokenID', label: 'Receiving Currency', required: true, placeholder: 'Currency code' },
          { name: 'receiverOwnerAddress', label: 'Receiver Account Number', required: true, placeholder: 'Receiver account number' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
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
        title: 'Approve Currency Exchange',
        description: 'Approve a pending currency exchange request.',
        method: 'POST',
        endpoint: '/token-transfer-requests/:requestId/approve',
        fields: [
          { name: 'requestId', label: 'Exchange Request ID', required: true, placeholder: 'Enter request ID' },
          { name: 'receiverOwnerAddress', label: 'Receiver Account Number', required: true, placeholder: 'Receiver account number' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
        ],
        buildRequest: values => {
          if (!values.requestId) {
            throw new Error('Exchange Request ID is required');
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
        title: 'View Exchange History',
        description: 'View historical currency exchanges.',
        method: 'GET',
        endpoint: '/token-transfer-history',
        fields: [
          { name: 'tokenID', label: 'Currency Code', required: true, placeholder: 'Currency code' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
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
    subtitle: 'Approve New Customers',
    helper: 'Review and approve new customer registration requests.',
    functions: [
      {
        key: 'viewPendingCustomerRegistrations',
        title: 'View Pending Registrations',
        description: 'List all customer registration requests awaiting approval.',
        method: 'GET',
        endpoint: '/bank/customer-registrations/pending',
        fields: [
          { name: 'tokenID', label: 'Currency Code', required: true, placeholder: 'Currency code' },
          { name: 'ownerNetworkAddress', label: 'Bank Account Number', placeholder: 'Your bank account number' },
          { name: 'customerAddress', label: 'Customer Account Number', placeholder: 'Filter by customer (optional)' }
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
        description: 'List all customers approved for your currency.',
        method: 'GET',
        endpoint: '/bank/customer-registrations/approved',
        fields: [
          { name: 'tokenID', label: 'Currency Code', required: true, placeholder: 'Currency code' },
          { name: 'ownerNetworkAddress', label: 'Bank Account Number', required: true, placeholder: 'Your bank account number' },
          { name: 'userId', label: 'Bank User ID', placeholder: 'User ID (optional)' }
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
        title: 'Review Registration Request',
        description: 'Approve or reject a customer registration request.',
        method: 'POST',
        endpoint: '/bank/customer-registrations/:requestId/approve',
        fields: [
          { name: 'requestId', label: 'Registration Request ID', required: true, placeholder: 'Registration request ID' },
          { name: 'ownerNetworkAddress', label: 'Bank Account Number', required: true, placeholder: 'Your bank account number' },
          {
            name: 'status',
            label: 'Decision',
            options: [
              { value: 'approved', label: 'Approve Registration' },
              { value: 'rejected', label: 'Reject Registration' }
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
    title: 'Fund Request Approvals',
    subtitle: 'Review Customer Fund Requests',
    helper: 'Review and approve requests from customers to add funds.',
    functions: [
      {
        key: 'viewPendingCustomerMintRequests',
        title: 'View Pending Fund Requests',
        description: 'View all customer requests to add funds awaiting approval.',
        method: 'GET',
        endpoint: '/bank/customer-mint-requests/pending',
        fields: [
          { name: 'tokenID', label: 'Currency Code', required: true, placeholder: 'Currency code' },
          { name: 'ownerNetworkAddress', label: 'Bank Account Number', placeholder: 'Your bank account number' }
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
        title: 'Review Fund Request',
        description: 'Approve or reject a customer fund request.',
        method: 'POST',
        endpoint: '/bank/customer-mint-requests/:requestId/approve',
        fields: [
          { name: 'requestId', label: 'Fund Request ID', required: true, placeholder: 'Request ID' },
          { name: 'ownerNetworkAddress', label: 'Bank Account Number', required: true, placeholder: 'Your bank account number' },
          { name: 'tokenID', label: 'Currency Code', required: true, placeholder: 'Currency code' },
          {
            name: 'status',
            label: 'Decision',
            options: [
              { value: 'approved', label: 'Approve Request' },
              { value: 'rejected', label: 'Reject Request' }
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
        data-testid={`lane-${lane.key}`}
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
  const [walletSnapshot, setWalletSnapshot] = useState({ loading: false, data: null, error: '' });

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
        
        const totalPending = 
          (Array.isArray(pendingTokenReqs) ? pendingTokenReqs.length : 0) +
          (Array.isArray(pendingMintReqs) ? pendingMintReqs.length : 0) +
          (Array.isArray(pendingCustomerRegs) ? pendingCustomerRegs.length : 0) +
          (Array.isArray(pendingCustomerMints) ? pendingCustomerMints.length : 0);
        
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

  useEffect(() => {
    if (!latestRegistration?.network_address || !latestRegistration?.username) {
      setWalletSnapshot(prev => ({ ...prev, data: null }));
      return;
    }

    let cancelled = false;
    const fetchWalletSnapshot = async () => {
      setWalletSnapshot(prev => ({ ...prev, loading: true, error: '' }));
      try {
        const { data } = await client.get('/bank/wallet', {
          params: {
            userId: latestRegistration.username,
            networkAddress: latestRegistration.network_address
          }
        });
        if (!cancelled) {
          setWalletSnapshot({ loading: false, data, error: '' });
        }
      } catch (error) {
        if (!cancelled) {
          const detail = error?.response?.data?.detail || error?.message || 'Unable to load wallet snapshot';
          setWalletSnapshot({ loading: false, data: null, error: detail });
        }
      }
    };

    fetchWalletSnapshot();
    return () => {
      cancelled = true;
    };
  }, [latestRegistration]);

  const foreignCurrencies = Array.isArray(walletSnapshot.data?.foreignCurrencies)
    ? walletSnapshot.data.foreignCurrencies
    : Array.isArray(walletSnapshot.data?.foreign_currencies)
      ? walletSnapshot.data.foreign_currencies
      : [];

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

      {walletSnapshot.loading && (
        <div className="glass-panel p-4 border border-white/5 text-sm text-white/70">Loading wallet snapshot…</div>
      )}
      {walletSnapshot.error && (
        <div className="glass-panel p-4 border border-red-500/30 bg-red-500/5 text-sm text-red-200">
          {walletSnapshot.error}
        </div>
      )}
      {walletSnapshot.data && !walletSnapshot.loading && (
        <div className="glass-panel p-6 border border-white/5 grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-xs uppercase text-white/50">Primary Currency</p>
            <p className="text-xl font-semibold">{walletSnapshot.data.currency || 'Pending assignment'}</p>
          </div>
          <div>
            <p className="text-xs uppercase text-white/50">Minted Supply</p>
            <p className="text-xl font-semibold">
              {walletSnapshot.data.mintedCoinsDisplay ||
                walletSnapshot.data.minted_coins_display ||
                walletSnapshot.data.mintedCoins ||
                0}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase text-white/50">Wallet Balance</p>
            <p className="text-xl font-semibold">
              {walletSnapshot.data.walletBalanceDisplay ||
                walletSnapshot.data.wallet_balance_display ||
                (walletSnapshot.data.currencySymbol || walletSnapshot.data.currency_symbol || '$') +
                  (walletSnapshot.data.walletBalance ||
                    walletSnapshot.data.wallet_balance ||
                    0).toLocaleString()}
            </p>
          </div>
        </div>
      )}
      {walletSnapshot.data && foreignCurrencies.length > 0 && (
        <div className="glass-panel p-6 border border-accent/20 space-y-4">
          <div>
            <p className="text-xs uppercase text-white/50">Foreign Currency Holdings</p>
            <p className="text-sm text-white/60">
              Balances received from other tokens are tracked separately from your domestic currency.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {foreignCurrencies.map((fx, idx) => (
              <div key={`${fx.currency || 'foreign'}-${idx}`} className="bg-white/5 rounded-xl p-4 space-y-2">
                <div className="text-xs uppercase text-white/50">Currency</div>
                <div className="text-lg font-semibold text-white">{fx.currency || 'Foreign'}</div>
                <div className="text-xs uppercase text-white/50">Balance</div>
                <div className="text-lg font-semibold text-white">
                  {fx.display ||
                    `${fx.currency_symbol || ''}${(fx.amount || 0).toLocaleString()}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {latestRegistration?.wallet_created && (
        <div className="glass-panel border-2 border-accent/30 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔑</span>
            <p className="text-sm uppercase tracking-wide text-accent font-semibold">Recent Registration</p>
          </div>
          <p className="text-sm text-white/70">Use these credentials when performing operations.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs uppercase text-white/40 mb-1">Username</p>
              <p className="font-mono text-sm text-white break-all">{latestRegistration.username}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs uppercase text-white/40 mb-1">Role</p>
              <p className="text-sm text-white">{latestRegistration.role === 'bank' ? 'Bank Institution' : latestRegistration.role === 'customer' ? 'Customer' : latestRegistration.role}</p>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs uppercase text-white/40 mb-1">Account Number</p>
            <p className="font-mono text-sm break-all text-accent">{latestRegistration.network_address || '—'}</p>
          </div>
        </div>
      )}

      <div className="glass-panel p-6 space-y-6 border border-white/5">
        <div>
          <h3 className="text-xl font-semibold mb-1">Operation Categories</h3>
          <p className="text-sm text-white/60">Choose a category to view and perform banking operations.</p>
        </div>
        <LaneSelector activeLane={activeLane} onSelect={setActiveLane} />
      </div>

      <LaneSection lane={currentLane} />
    </div>
  );
};

export default BankDashboard;
