import { useEffect, useState } from 'react';
import { safeGet } from '../services/apiClient';
import client from '../services/apiClient';

const cleanPayload = payload =>
  Object.entries(payload).reduce((acc, [key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      acc[key] = value;
    }
    return acc;
  }, {});

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

const ActionCard = ({ icon, title, description, onClick, color = 'accent' }) => (
  <button
    onClick={onClick}
    className={`glass-panel p-8 text-left transition border border-white/5 hover:border-${color}/40 hover:bg-${color}/5 group w-full`}
    data-testid={`action-${title.toLowerCase().replace(/\s+/g, '-')}`}
  >
    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-sm text-white/60">{description}</p>
  </button>
);

const SimpleForm = ({ title, fields, onSubmit, onCancel, isLoading, response, error }) => {
  const [values, setValues] = useState(
    fields.reduce((acc, field) => {
      acc[field.name] = field.defaultValue ?? '';
      return acc;
    }, {})
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(values);
  };

  return (
    <div className="glass-panel p-8 border border-white/5">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold">{title}</h3>
        <button
          onClick={onCancel}
          className="text-white/60 hover:text-white transition"
          data-testid="close-form-button"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-white/90 mb-2">
              {field.label}
              {field.required && <span className="text-red-400 ml-1">*</span>}
            </label>
            {field.type === 'select' ? (
              <select
                value={values[field.name]}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                required={field.required}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition"
                data-testid={`select-${field.name}`}
              >
                <option value="">{field.placeholder || 'Select...'}</option>
                {field.options?.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type || 'text'}
                value={values[field.name]}
                onChange={(e) => setValues({ ...values, [field.name]: e.target.value })}
                placeholder={field.placeholder}
                required={field.required}
                className="w-full rounded-xl bg-white/5 border border-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 transition"
                data-testid={`input-${field.name}`}
              />
            )}
            {field.helper && <p className="text-xs text-white/50 mt-1.5">{field.helper}</p>}
          </div>
        ))}

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 rounded-xl bg-accent px-6 py-4 text-base font-semibold text-slate-950 transition hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="submit-button"
          >
            {isLoading ? 'Processing...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/20 px-8 py-4 text-base font-medium text-white/70 hover:bg-white/5 hover:text-white transition"
            data-testid="cancel-button"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 flex items-start gap-3" data-testid="error-message">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-300 mb-1">Request Failed</p>
              <p className="text-sm text-red-200">{error}</p>
            </div>
          </div>
        )}

        {response && (
          <div className="rounded-xl border border-green-500/40 bg-green-500/10 p-4" data-testid="success-message">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">✅</span>
              <p className="text-sm font-semibold text-green-300">Success</p>
            </div>
            <pre className="max-h-60 overflow-auto rounded-lg bg-black/30 p-4 text-xs text-white/80 font-mono">
              {typeof response === 'string' ? response : JSON.stringify(response, null, 2)}
            </pre>
          </div>
        )}
      </form>
    </div>
  );
};

const ParticipantDashboard = () => {
  const [latestRegistration, setLatestRegistration] = useState(() => getStoredRegistrationSnapshot());
  const [activeAction, setActiveAction] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [availableTokens, setAvailableTokens] = useState([]);
  const [stats, setStats] = useState({
    balance: 0,
    balanceDisplay: '',
    currencySymbol: '',
    pendingRequests: 0,
    completedToday: 0
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
        const registration = getStoredRegistrationSnapshot();
        
        if (!registration?.network_address) {
          return;
        }

        const [transferHistory, allTokens] = await Promise.all([
          safeGet('/participant/transfer-history', { 
            params: { 
              networkAddress: registration.network_address 
            } 
          }),
          safeGet('/bank/view-all-tokens', [])
        ]);
        
        // Store available tokens in state
        if (Array.isArray(allTokens)) {
          setAvailableTokens(allTokens);
        }
        
        let balance = 0;
        let balanceDisplay = '';
        let currencySymbol = '';
        if (allTokens && allTokens.length > 0) {
          try {
            const { data: walletResponse } = await client.get('/customer/wallet', {
              params: {
                networkAddress: registration.network_address,
                tokenID: allTokens[0].id || allTokens[0].tokenID,
                userId: registration.username
              }
            });
            let payload = walletResponse?.wallet ?? walletResponse?.result ?? walletResponse;
            if (typeof payload === 'string') {
              try {
                payload = JSON.parse(payload);
              } catch (parseError) {
                console.warn('Unable to parse wallet payload:', parseError.message);
              }
            }
            const walletDetails = payload?.wallet_details || payload || {};
            balance =
              walletDetails.wallet_balance ??
              walletDetails.walletBalance ??
              walletDetails.balance ??
              0;
            balanceDisplay =
              walletDetails.wallet_balance_display ||
              walletDetails.walletBalanceDisplay ||
              walletDetails.balance_display ||
              walletDetails.balanceDisplay ||
              '';
            currencySymbol =
              walletDetails.currency_symbol ||
              walletDetails.currencySymbol ||
              payload?.currency_symbol ||
              payload?.currencySymbol ||
              '';
          } catch (walletErr) {
            console.warn('Unable to fetch wallet snapshot:', walletErr?.message || walletErr);
          }
        }
        
        const today = new Date().toDateString();
        const transfers = Array.isArray(transferHistory) ? transferHistory : [];
        
        const pendingCount = transfers.filter(tx => 
          tx.status === 'pending' || tx.status === 'requested'
        ).length;
        
        const completedToday = transfers.filter(tx => {
          if (tx.status !== 'completed' && tx.status !== 'approved') return false;
          if (!tx.timestamp) return false;
          const txDate = new Date(tx.timestamp).toDateString();
          return txDate === today;
        }).length;
        
        setStats({
          balance,
          balanceDisplay,
          currencySymbol,
          pendingRequests: pendingCount,
          completedToday
        });
      } catch (error) {
        console.warn('Failed to fetch customer stats:', error);
      }
    };

    fetchStats();
  }, [latestRegistration]);

  const handleAction = async (values) => {
    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      let requestConfig = {};
      const cleanedValues = cleanPayload(values);

      switch(activeAction) {
        case 'register':
          requestConfig = {
            method: 'POST',
            url: '/bank/register-customer',
            data: cleanPayload({
              networkAddress: cleanedValues.accountNumber,
              name: cleanedValues.fullName,
              tokenID: cleanedValues.tokenID
            })
          };
          break;

        case 'send':
          requestConfig = {
            method: 'POST',
            url: '/transfer-request',
            data: cleanPayload({
              senderParticipantID: cleanedValues.senderAccount,
              receiverParticipantID: cleanedValues.recipientAccount,
              senderTokenTransferID: cleanedValues.senderTransferId,
              receiverTokenTransferID: cleanedValues.receiverTransferId,
              tokenID: cleanedValues.currency,
              amount: cleanedValues.amount
            })
          };
          break;

        case 'add':
          requestConfig = {
            method: 'POST',
            url: '/bank/request-mint',
            data: cleanPayload({
              networkAddress: cleanedValues.accountNumber,
              tokenID: cleanedValues.currency,
              amount: cleanedValues.amount,
              reason: cleanedValues.reason
            })
          };
          break;

        case 'balance':
          requestConfig = {
            method: 'GET',
            url: '/customer/wallet',
            params: cleanPayload({
              networkAddress: cleanedValues.accountNumber,
              tokenID: cleanedValues.currency
            })
          };
          break;

        case 'history':
          requestConfig = {
            method: 'GET',
            url: '/participant/transfer-history',
            params: cleanPayload({
              networkAddress: cleanedValues.accountNumber
            })
          };
          break;

        default:
          throw new Error('Unknown action');
      }

      const { data } = await client(requestConfig);
      setResponse(data);
    } catch (requestError) {
      const detail =
        requestError?.response?.data?.detail ||
        requestError?.response?.data?.error ||
        requestError?.message ||
        'Unable to complete request';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  const getFormFields = () => {
    const registration = latestRegistration || {};
    
    switch(activeAction) {
      case 'register':
        return [
          { name: 'accountNumber', label: 'Your Account ID', required: true, placeholder: 'Your account identifier', defaultValue: registration.network_address || '' },
          { name: 'fullName', label: 'Full Name', required: true, placeholder: 'Enter your full name' },
          { 
            name: 'tokenID', 
            label: 'Select Currency', 
            type: 'select',
            required: true, 
            placeholder: 'Choose a currency',
            options: availableTokens.map(token => ({
              value: token.id || token.tokenID || token.token_id || '',
              label: `${token.currency || token.name || 'Unknown'} (${token.id || token.tokenID || token.token_id || ''})`
            }))
          }
        ];

      case 'send':
        return [
          { name: 'senderAccount', label: 'Your Customer ID', required: true, placeholder: 'Your customer identifier', defaultValue: registration.network_address || '' },
          { name: 'recipientAccount', label: 'Recipient Customer ID', required: true, placeholder: 'Recipient identifier' },
          { name: 'senderTransferId', label: 'Your Transfer Account', required: true, placeholder: 'Your transfer account ID' },
          { name: 'receiverTransferId', label: 'Recipient Transfer Account', required: true, placeholder: 'Recipient transfer account ID' },
          { name: 'currency', label: 'Currency', required: true, placeholder: 'e.g., USD, EUR, GBP' },
          { name: 'amount', label: 'Amount', required: true, type: 'number', placeholder: 'Enter amount' }
        ];
      
      case 'add':
        return [
          { name: 'accountNumber', label: 'Your Account Number', required: true, placeholder: 'Your account number', defaultValue: registration.network_address || '' },
          { name: 'currency', label: 'Currency', required: true, placeholder: 'e.g., USD, EUR, GBP' },
          { name: 'amount', label: 'Amount', required: true, type: 'number', placeholder: 'Amount to add' },
          { name: 'reason', label: 'Purpose (Optional)', placeholder: 'Reason for adding funds' }
        ];
      
      case 'balance':
        return [
          { name: 'accountNumber', label: 'Account Number', required: true, placeholder: 'Your account number', defaultValue: registration.network_address || '' },
          { name: 'currency', label: 'Currency', required: true, placeholder: 'e.g., USD, EUR, GBP' }
        ];
      
      case 'history':
        return [
          { name: 'accountNumber', label: 'Account Number', placeholder: 'Your account number (optional)', defaultValue: registration.network_address || '' }
        ];
      
      default:
        return [];
    }
  };

  const getFormTitle = () => {
    switch(activeAction) {
      case 'register': return 'Register for Currency';
      case 'send': return 'Send Money Internationally';
      case 'add': return 'Add Funds to Account';
      case 'balance': return 'Check Account Balance';
      case 'history': return 'View Transaction History';
      default: return '';
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 space-y-4 border border-white/5">
        <div>
          <p className="text-xs uppercase tracking-wide text-white/40">Customer Portal</p>
          <h2 className="text-3xl font-bold mt-1">International Banking</h2>
          <p className="text-sm text-white/60 mt-2">
            Simple and secure way to manage your international transactions
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard 
          icon="💼" 
          label="Account Balance" 
          value={
            stats.balanceDisplay ||
            (stats.balance > 0
              ? `${stats.currencySymbol || '$'}${stats.balance.toLocaleString()}`
              : '—')
          } 
          subtext="Available funds" 
        />
        <StatCard 
          icon="⏳" 
          label="Pending" 
          value={stats.pendingRequests.toLocaleString()} 
          subtext="Awaiting approval" 
        />
        <StatCard 
          icon="✅" 
          label="Completed Today" 
          value={stats.completedToday.toLocaleString()} 
          subtext="Successful transfers" 
        />
      </div>

      {latestRegistration?.wallet_created && (
        <div className="glass-panel border-2 border-accent/30 p-6 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🔑</span>
            <p className="text-sm uppercase tracking-wide text-accent font-semibold">Your Account Details</p>
          </div>
          <p className="text-sm text-white/70">Keep these credentials secure. You'll need them for transactions.</p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs uppercase text-white/40 mb-1">Username</p>
              <p className="font-mono text-sm text-white break-all">{latestRegistration.username}</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4">
              <p className="text-xs uppercase text-white/40 mb-1">Account Number</p>
              <p className="font-mono text-sm break-all text-accent">{latestRegistration.network_address || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {!activeAction ? (
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-2">What would you like to do?</h3>
            <p className="text-sm text-white/60">Choose an action to get started</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <ActionCard
              icon="✅"
              title="Register for Currency"
              description="Register your account to access a specific currency"
              onClick={() => setActiveAction('register')}
            />
            <ActionCard
              icon="🌍"
              title="Send Money"
              description="Transfer funds internationally to another account"
              onClick={() => setActiveAction('send')}
            />
            <ActionCard
              icon="💵"
              title="Add Funds"
              description="Request to add money to your account"
              onClick={() => setActiveAction('add')}
            />
            <ActionCard
              icon="💼"
              title="Check Balance"
              description="View your current account balance"
              onClick={() => setActiveAction('balance')}
            />
            <ActionCard
              icon="📊"
              title="Transaction History"
              description="View all your past transactions"
              onClick={() => setActiveAction('history')}
            />
          </div>
        </div>
      ) : (
        <SimpleForm
          title={getFormTitle()}
          fields={getFormFields()}
          onSubmit={handleAction}
          onCancel={() => {
            setActiveAction(null);
            setResponse(null);
            setError('');
          }}
          isLoading={isLoading}
          response={response}
          error={error}
        />
      )}
    </div>
  );
};

export default ParticipantDashboard;
