import { useEffect, useState } from 'react';
import { FunctionCard } from '../components';

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
    title: 'viewAllTokens',
    description: 'List every token available on-chain via /api/bank/view-all-tokens.',
    method: 'GET',
    endpoint: '/bank/view-all-tokens',
    fields: [],
    buildRequest: () => ({})
  },
  {
    key: 'registerCustomer',
    title: 'registerCustomer',
    description: 'Register a customer wallet for a given token.',
    method: 'POST',
    endpoint: '/bank/register-customer',
    fields: [
      { name: 'networkAddress', label: 'networkAddress', required: true, placeholder: 'customer network hash' },
      { name: 'name', label: 'name', required: true, placeholder: 'Customer name' },
      { name: 'passwordHash', label: 'passwordHash', required: true, placeholder: 'SHA-256 hash' },
      { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' }
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
    title: 'customerRequestMint',
    description: 'Submit a mint request for additional supply through /api/bank/request-mint.',
    method: 'POST',
    endpoint: '/bank/request-mint',
    fields: [
      { name: 'networkAddress', label: 'networkAddress', required: true, placeholder: 'owner network hash' },
      { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' },
      { name: 'amount', label: 'amount', required: true, type: 'number', placeholder: '1000' },
      { name: 'passwordHash', label: 'passwordHash', required: true, placeholder: 'SHA-256 hash' },
      { name: 'reason', label: 'reason', placeholder: 'Optional description' }
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
    title: 'createTransferRequest',
    description: 'Create a participant transfer request via /api/transfer-request.',
    method: 'POST',
    endpoint: '/transfer-request',
    fields: [
      { name: 'senderParticipantID', label: 'senderParticipantID', required: true, placeholder: 'sender participant ID' },
      { name: 'receiverParticipantID', label: 'receiverParticipantID', required: true, placeholder: 'receiver participant ID' },
      {
        name: 'senderTokenTransferID',
        label: 'senderTokenTransferID',
        required: true,
        placeholder: 'sender token transfer ID'
      },
      {
        name: 'receiverTokenTransferID',
        label: 'receiverTokenTransferID',
        required: true,
        placeholder: 'receiver token transfer ID'
      },
      { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' },
      { name: 'amount', label: 'amount', required: true, type: 'number', placeholder: '100' }
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
    title: 'viewCustomerWallet',
    description: 'Inspect a customer wallet by calling /api/customer/wallet.',
    method: 'GET',
    endpoint: '/customer/wallet',
    fields: [
      { name: 'userId', label: 'userId', placeholder: 'customer username' },
      { name: 'networkAddress', label: 'networkAddress', required: true, placeholder: 'customer network hash' },
      { name: 'tokenID', label: 'tokenID', required: true, placeholder: 'token_1' },
      { name: 'passwordHash', label: 'passwordHash', required: true, placeholder: 'SHA-256 hash' }
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
    title: 'listParticipantTransferHistory',
    description: 'View your settled transfer history via /api/participant/transfer-history.',
    method: 'GET',
    endpoint: '/participant/transfer-history',
    fields: [
      { name: 'userId', label: 'userId', placeholder: 'participant identity' },
      { name: 'networkAddress', label: 'networkAddress', placeholder: 'participant network hash (optional)' },
      { name: 'passwordHash', label: 'passwordHash', placeholder: 'SHA-256 hash (optional)' }
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

const ParticipantDashboard = () => {
  const [latestRegistration, setLatestRegistration] = useState(() => getStoredRegistrationSnapshot());

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
      <div className="glass-panel p-6 space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/40">participant fabric console</p>
        <h2 className="text-2xl font-semibold">Customer Dashboard • Direct Blockchain Calls</h2>
        <p className="text-sm text-white/60">
          Use the panels below to call the participant-facing Fabric functions (<code>viewAllTokens</code>,{' '}
          <code>registerCustomer</code>, <code>customerRequestMint</code>, <code>createTransferRequest</code>,{' '}
          <code>viewCustomerWallet</code>) directly through their REST adapters.
        </p>
      </div>

      {latestRegistration?.wallet_created && (
        <div className="glass-panel border border-accent/30 p-4 space-y-2">
          <p className="text-xs uppercase tracking-[0.3em] text-accent">latest registration snapshot</p>
          <p className="text-sm text-white/60">
            Captured at registration time. Use this network address and password hash when hitting the participant APIs.
          </p>
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
            Stored locally{' '}
            {latestRegistration.timestamp ? `• ${new Date(latestRegistration.timestamp).toLocaleString()}` : ''}
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {PARTICIPANT_FUNCTIONS.map(fn => (
          <FunctionCard key={fn.key} {...fn} />
        ))}
      </div>
    </div>
  );
};

export default ParticipantDashboard;
