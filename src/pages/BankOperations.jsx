import { useEffect, useState } from 'react';
import { FunctionCard } from '../components';

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
    title: 'Register lane',
    subtitle: 'Onboard participants',
    helper:
      '1) Register the participant identity on Fabric. 2) Check whether the generated network address already exists.',
    functions: [
      {
        key: 'submitRegistration',
        title: 'submitRegistration',
        description: 'Register a participant identity via /api/participant/register.',
        method: 'POST',
        endpoint: '/participant/register',
        fields: [
          { name: 'userId', label: 'userId', placeholder: 'alice', required: true },
          { name: 'password', label: 'password', placeholder: 'Plaintext password (optional)', type: 'password' },
          {
            name: 'passwordHash',
            label: 'passwordHash',
            placeholder: 'SHA-256 hash',
            helper: 'If provided, password is ignored'
          },
          { name: 'country', label: 'country', defaultValue: 'US', placeholder: 'US' }
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
        title: 'participantExists',
        description: 'Check if a network address already exists on-chain.',
        method: 'GET',
        endpoint: '/participant/exists',
        fields: [{ name: 'networkAddress', label: 'networkAddress', required: true, placeholder: '0xabc...' }],
        buildRequest: values => ({
          params: cleanPayload({ networkAddress: values.networkAddress })
        })
      }
    ]
  },
  {
    key: 'token',
    title: 'Token lane',
    subtitle: 'Token access lifecycle',
    helper: 'Request token access and retrieve the resulting permissions after approval.',
    functions: [
      {
        key: 'requestTokenRequest',
        title: 'requestTokenRequest',
        description: 'Submit a token access request via /api/token-request.',
        method: 'POST',
        endpoint: '/token-request',
        fields: [
          { name: 'userId', label: 'userId', required: true, placeholder: 'alice' },
          { name: 'name', label: 'name', required: true, placeholder: 'Alice Bank' },
          { name: 'networkAddress', label: 'networkAddress', placeholder: 'network hash' },
          { name: 'password', label: 'password', type: 'password', placeholder: 'Plaintext password' },
          {
            name: 'passwordHash',
            label: 'passwordHash',
            placeholder: 'SHA-256 hash',
            helper: 'Optional override for password'
          },
          { name: 'country', label: 'country', defaultValue: 'US', placeholder: 'US' }
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
        title: 'getTokenAccess',
        description: 'Evaluate token access via /api/bank/get-token-access.',
        method: 'POST',
        endpoint: '/bank/get-token-access',
        fields: [
          { name: 'userId', label: 'userId', required: true, placeholder: 'alice' },
          { name: 'networkAddress', label: 'networkAddress', required: true, placeholder: 'network hash' },
          { name: 'tokenId', label: 'tokenId', required: true, placeholder: 'token_1' }
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
    title: 'Mint lane',
    subtitle: 'Supply requests',
    helper: 'Submit a mint request and inspect wallet details for verification.',
    functions: [
      {
        key: 'requestMintCoins',
        title: 'requestMintCoins',
        description: 'Submit a mint request via /api/mint-request.',
        method: 'POST',
        endpoint: '/mint-request',
        fields: [
          { name: 'userId', label: 'userId', required: true, placeholder: 'alice' },
          { name: 'networkAddress', label: 'networkAddress', required: true, placeholder: 'network hash' },
          { name: 'amount', label: 'amount', required: true, type: 'number', placeholder: '1000' },
          { name: 'password', label: 'password', type: 'password', placeholder: 'Plaintext password (hashed server-side)' }
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
        title: 'getWalletInfo',
        description: 'Retrieve wallet information via /api/bank/wallet.',
        method: 'GET',
        endpoint: '/bank/wallet',
        fields: [
          { name: 'userId', label: 'userId', required: true, placeholder: 'alice' },
          { name: 'networkAddress', label: 'networkAddress', required: true, placeholder: 'network hash' },
          { name: 'password', label: 'password', type: 'password', placeholder: 'Plaintext password (optional)' },
          { name: 'passwordHash', label: 'passwordHash', placeholder: 'SHA-256 hash', helper: 'Preferred input if already hashed' }
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
    title: 'Transfer lane',
    subtitle: 'Owner approvals + monitoring',
    helper: 'List transfer requests for owners or receivers and approve them directly from the dashboard.',
    functions: [
      {
        key: 'viewTransferRequestsForOwner',
        title: 'viewTransferRequestsForOwner',
        description: 'Fetch owner-linked transfer requests via /api/transfer-requests/owner.',
        method: 'GET',
        endpoint: '/transfer-requests/owner',
        fields: [
          { name: 'ownerID', label: 'ownerID', required: true, placeholder: 'owner transfer ID' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (defaults to admin)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({ ownerID: values.ownerID, userId: values.userId })
        })
      },
      {
        key: 'viewTransferRequestsForReceiver',
        title: 'viewTransferRequestsForReceiver',
        description: 'Fetch receiver-linked transfer requests via /api/transfer-requests/receiver.',
        method: 'GET',
        endpoint: '/transfer-requests/receiver',
        fields: [
          { name: 'receiverID', label: 'receiverID', required: true, placeholder: 'receiver transfer ID' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (defaults to admin)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({ receiverID: values.receiverID, userId: values.userId })
        })
      },
      {
        key: 'approveTransferByOwner',
        title: 'approveTransferByOwner',
        description: 'Approve pending transfers via /api/transfer-requests/:transferId/approve-owner.',
        method: 'POST',
        endpoint: '/transfer-requests/:transferId/approve-owner',
        fields: [
          { name: 'transferId', label: 'transferId', required: true, placeholder: 'Transfer request ID' },
          { name: 'approver', label: 'approver', placeholder: 'owner identity submitting approval' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity if different' }
        ],
        buildRequest: values => {
          if (!values.transferId) {
            throw new Error('transferId is required to approve a transfer');
          }
          return {
            url: `/transfer-requests/${encodeURIComponent(values.transferId)}/approve-owner`,
            data: cleanPayload({ approver: values.approver, userId: values.userId })
          };
        }
      }
      ,
      {
        key: 'approveTransferByReceiverOwner',
        title: 'approveTransferByReceiverOwner',
        description: 'Receiver owner approval via /api/transfer-requests/:transferId/approve-receiver-owner.',
        method: 'POST',
        endpoint: '/transfer-requests/:transferId/approve-receiver-owner',
        fields: [
          { name: 'transferId', label: 'transferId', required: true, placeholder: 'Transfer request ID' },
          { name: 'approver', label: 'approver', placeholder: 'receiver owner network address' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity if different' }
        ],
        buildRequest: values => {
          if (!values.transferId) {
            throw new Error('transferId is required to approve a transfer');
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
    title: 'List lane',
    subtitle: 'Approved participants and participant mint data',
    helper: 'Bank view restricted to approved participants and participant-level mint activity.',
    functions: [
      {
        key: 'listApprovedParticipants',
        title: 'listApprovedParticipants',
        description: 'List participants that have been approved via /api/bank/participants/approved.',
        method: 'GET',
        endpoint: '/bank/participants/approved',
        fields: [
          { name: 'networkAddress', label: 'networkAddress', placeholder: 'filter by participant network hash (optional)' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (default admin)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({ networkAddress: values.networkAddress, userId: values.userId })
        })
      },
      {
        key: 'listApprovedParticipantMintRequests',
        title: 'listApprovedParticipantMintRequests',
        description: 'View all approved customer mint requests via /api/participant-mint-requests/approved.',
        method: 'GET',
        endpoint: '/participant-mint-requests/approved',
        fields: [
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (default admin)' }
        ],
        buildRequest: values => ({
          params: cleanPayload({
            userId: values.userId
          })
        })
      },
      {
        key: 'listTokenToTokenTransferHistory',
        title: 'listTokenToTokenTransferHistory',
        description: 'View token-to-token transfer history via /api/token-transfer-history.',
        method: 'GET',
        endpoint: '/token-transfer-history',
        fields: [
          { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (default admin)' }
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
        title: 'listParticipantTransferHistory',
        description: 'Fetch participant transfer history (bank view) via /api/participant/transfer-history.',
        method: 'GET',
        endpoint: '/participant/transfer-history',
        fields: [
          { name: 'participantID', label: 'participantID', required: true, placeholder: 'participant network/transfer id' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (defaults to admin/bank)' }
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
    title: 'Token-to-token lane',
    subtitle: 'Move minted supply across tokens',
    helper: 'Initiate token transfer requests, monitor pending approvals for receiver tokens, and finalize them.',
    functions: [
      {
        key: 'createTokenTransferRequest',
        title: 'createTokenTransferRequest',
        description: 'Create a token-to-token transfer request via /api/token-transfer-request.',
        method: 'POST',
        endpoint: '/token-transfer-request',
        fields: [
          { name: 'senderTokenID', label: 'senderTokenID', required: true, placeholder: 'token_1' },
          { name: 'receiverTokenID', label: 'receiverTokenID', required: true, placeholder: 'token_2' },
          { name: 'senderOwnerAddress', label: 'senderOwnerAddress', required: true, placeholder: 'owner network address' },
          { name: 'amount', label: 'amount', required: true, type: 'number', placeholder: '100' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (defaults to owner)' }
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
        title: 'viewPendingTokenTransferRequests',
        description: 'List pending requests for a receiver token via /api/token-transfer-requests/pending.',
        method: 'GET',
        endpoint: '/token-transfer-requests/pending',
        fields: [
          { name: 'receiverTokenID', label: 'receiverTokenID', required: true, placeholder: 'token_2' },
          { name: 'receiverOwnerAddress', label: 'receiverOwnerAddress', required: true, placeholder: 'owner network address' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (defaults to owner)' }
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
        title: 'approveTokenTransferRequest',
        description: 'Approve a pending token transfer via /api/token-transfer-requests/:requestId/approve.',
        method: 'POST',
        endpoint: '/token-transfer-requests/:requestId/approve',
        fields: [
          { name: 'requestId', label: 'requestId', required: true, placeholder: 'tokentransfer_abc...' },
          { name: 'receiverOwnerAddress', label: 'receiverOwnerAddress', required: true, placeholder: 'owner network address' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (defaults to owner)' }
        ],
        buildRequest: values => {
          if (!values.requestId) {
            throw new Error('requestId is required to approve a token transfer');
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
        title: 'listTokenToTokenTransferHistory',
        description: 'List historical token-to-token transfers for a token via /api/token-transfer-history.',
        method: 'GET',
        endpoint: '/token-transfer-history',
        fields: [
          { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (defaults to admin)' }
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
    title: 'Customer lane',
    subtitle: 'Customer registrations',
    helper: 'Monitor and approve customer registrations for your token.',
    functions: [
      {
        key: 'viewPendingCustomerRegistrations',
        title: 'viewPendingCustomerRegistrations',
        description: 'List registrations via /api/bank/customer-registrations/pending.',
        method: 'GET',
        endpoint: '/bank/customer-registrations/pending',
        fields: [
          { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' },
          { name: 'ownerNetworkAddress', label: 'ownerNetworkAddress', placeholder: 'owner hash' },
          { name: 'customerAddress', label: 'customerAddress', placeholder: 'customer hash (optional)' }
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
        title: 'listApprovedCustomers',
        description: 'List bank-approved customer registrations via /api/bank/customer-registrations/approved.',
        method: 'GET',
        endpoint: '/bank/customer-registrations/approved',
        fields: [
          { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' },
          { name: 'ownerNetworkAddress', label: 'ownerNetworkAddress', required: true, placeholder: 'owner hash' },
          { name: 'userId', label: 'userId', placeholder: 'wallet identity (defaults to admin)' }
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
        title: 'approveCustomerRegistration',
        description: 'Approve or reject a pending customer registration request.',
        method: 'POST',
        endpoint: '/bank/customer-registrations/:requestId/approve',
        fields: [
          { name: 'requestId', label: 'requestId', required: true, placeholder: 'registration id' },
          { name: 'ownerNetworkAddress', label: 'ownerNetworkAddress', required: true, placeholder: 'owner hash' },
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
          if (!values.requestId) {
            throw new Error('requestId is required to approve a registration');
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
    title: 'Customer mint lane',
    subtitle: 'Customer mint approvals',
    helper: 'Check customer mint requests and approve or reject them.',
    functions: [
      {
        key: 'viewPendingCustomerMintRequests',
        title: 'viewPendingCustomerMintRequests',
        description: 'Inspect pending customer mint requests via /api/bank/customer-mint-requests/pending.',
        method: 'GET',
        endpoint: '/bank/customer-mint-requests/pending',
        fields: [
          { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' },
          { name: 'ownerNetworkAddress', label: 'ownerNetworkAddress', placeholder: 'owner hash' }
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
        title: 'approveCustomerMint',
        description: 'Approve customer mint requests via /api/bank/customer-mint-requests/:requestId/approve.',
        method: 'POST',
        endpoint: '/bank/customer-mint-requests/:requestId/approve',
        fields: [
          { name: 'requestId', label: 'requestId', required: true, placeholder: 'mint request id' },
          { name: 'ownerNetworkAddress', label: 'ownerNetworkAddress', required: true, placeholder: 'owner hash' },
          { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' },
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
          if (!values.requestId) {
            throw new Error('requestId is required to approve a mint request');
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

const LaneSelector = ({ activeLane, onSelect }) => (
  <div className="flex flex-wrap gap-3">
    {LANES.map(lane => (
      <button
        key={lane.key}
        type="button"
        onClick={() => onSelect(lane.key)}
        className={`px-6 py-2 rounded-xl text-sm font-semibold transition ${
          activeLane === lane.key ? 'bg-accent text-slate-950' : 'bg-white/10 text-white/70 hover:bg-white/20'
        }`}
      >
        {lane.title}
      </button>
    ))}
  </div>
);

const LaneSection = ({ lane }) => (
  <div className="glass-panel p-6 space-y-4 border border-white/5">
    <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.35em] text-white/40">{lane.title}</p>
        <h3 className="text-xl font-semibold">{lane.subtitle}</h3>
      </div>
      {lane.helper && <p className="text-xs text-white/50 max-w-lg">{lane.helper}</p>}
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

  const currentLane = LANES.find(lane => lane.key === activeLane) || LANES[0];

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/40">fabric function surface</p>
          <h2 className="text-2xl font-semibold">Bank Dashboard • Lane selector</h2>
          <p className="text-sm text-white/60">
            Choose a lane to focus on the exact pair of Fabric functions needed for that workflow.
          </p>
        </div>
        <LaneSelector activeLane={activeLane} onSelect={setActiveLane} />
      </div>

      {latestRegistration?.wallet_created && (
        <div className="glass-panel border border-accent/30 p-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">latest registration snapshot</p>
          <p className="text-sm text-white/60">Use this network address & password hash when working through the lanes.</p>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase text-white/40">username</p>
              <p className="font-mono text-sm break-all">{latestRegistration.username}</p>
            </div>
            <div>
              <p className="text-[11px] uppercase text-white/40">role</p>
              <p className="text-sm">{latestRegistration.role}</p>
            </div>
          </div>
          <div>
            <p className="text-[11px] uppercase text-white/40">network address</p>
            <p className="font-mono text-sm break-all text-accent">{latestRegistration.network_address || '—'}</p>
          </div>
          <div>
            <p className="text-[11px] uppercase text-white/40">password hash</p>
            <p className="font-mono text-sm break-all text-accentSecondary">{latestRegistration.password_hash || '—'}</p>
          </div>
          <p className="text-[11px] text-white/40">
            Stored locally {latestRegistration.timestamp ? `• ${new Date(latestRegistration.timestamp).toLocaleString()}` : ''}
          </p>
        </div>
      )}

      <LaneSection lane={currentLane} />
    </div>
  );
};

export default BankDashboard;
