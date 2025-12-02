import { useEffect, useState } from 'react';
import { safeGet, safePost } from '../services/apiClient';

const roleOptions = [
  { value: 'admin', label: 'Admin (Command Centre)' },
  { value: 'bank', label: 'Token Owner (Bank Dashboard)' },
  { value: 'customer', label: 'Participant (Participant Dashboard)' }
];

const defaultLoginForm = { name: '', password: '', role: 'admin' };
const defaultRegisterForm = { name: '', password: '', role: 'bank' };

const normalizeRole = (apiRole, fallbackRole) => {
  const allowed = ['admin', 'bank', 'customer'];
  if (allowed.includes(apiRole)) {
    return apiRole;
  }
  if (apiRole === 'user' && allowed.includes(fallbackRole)) {
    return fallbackRole;
  }
  return fallbackRole && allowed.includes(fallbackRole) ? fallbackRole : 'customer';
};

const RegistrationDashboard = ({ onAuthenticate }) => {
  const [walletUsers, setWalletUsers] = useState([]);
  const [health, setHealth] = useState(null);
  const [initMessage, setInitMessage] = useState('');
  const [loginForm, setLoginForm] = useState(defaultLoginForm);
  const [loginStatus, setLoginStatus] = useState(null);
  const [registerForm, setRegisterForm] = useState(defaultRegisterForm);
  const [registerStatus, setRegisterStatus] = useState(null);
  const [registerResult, setRegisterResult] = useState(null);

  const refreshWalletUsers = async () => {
    const response = await safeGet('/users', []);
    setWalletUsers(response.users || response || []);
  };

  useEffect(() => {
    refreshWalletUsers();
    safeGet('/health', null).then(setHealth);
  }, []);

  const initLedger = async () => {
    const response = await safePost('/admin/init-ledger', { userId: 'admin' }, { message: 'offline mode' });
    setInitMessage(response.message || 'Initialized');
  };

  const handleLogin = async event => {
    event.preventDefault();
    const username = loginForm.name.trim();
    if (!username || !loginForm.password) {
      setLoginStatus('Name and password are required');
      return;
    }

    try {
      setLoginStatus('Authenticating via /api/auth/login ...');
      const loginResponse = await safePost(
        '/auth/login',
        { username, password: loginForm.password },
        { success: false, detail: 'Login service unavailable' }
      );

      if (!loginResponse?.success) {
        setLoginStatus(loginResponse?.detail || 'Login failed');
        return;
      }

      const resolvedRole = normalizeRole(loginResponse?.role, loginForm.role);
      setLoginStatus(`Access granted as ${resolvedRole}`);
      onAuthenticate?.(resolvedRole);
    } catch (error) {
      setLoginStatus('Unexpected error during authentication');
    }
  };

  const handleRegister = async event => {
    event.preventDefault();
    const name = registerForm.name.trim();
    if (!name || !registerForm.password) {
      setRegisterStatus('Name and password are required');
      return;
    }

    try {
      setRegisterStatus('Submitting registration...');
      setRegisterResult(null);

      let endpoint = '/auth/register';
      const payload = { name, password: registerForm.password };

      if (registerForm.role === 'admin') {
        endpoint = '/auth/enroll';
      } else {
        payload.role = registerForm.role;
      }

      const response = await safePost(endpoint, payload, { success: false, detail: 'Registration unavailable' });

      if (!response?.success && !response?.token) {
        setRegisterStatus(response?.detail || 'Registration failed');
        return;
      }

      const resultPayload = {
        network_address: response?.network_address,
        password_hash: response?.password_hash,
        wallet_created: response?.wallet_created ?? true,
        username: response?.username || name,
        role: registerForm.role,
        timestamp: Date.now()
      };
      setRegisterStatus('Registration successful. Store the generated credentials below.');
      setRegisterResult(resultPayload.network_address || resultPayload.password_hash ? resultPayload : null);
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem('latestRegistrationCredentials', JSON.stringify(resultPayload));
          window.dispatchEvent(new CustomEvent('latest-registration-credentials', { detail: resultPayload }));
        } catch (storageError) {
          console.warn('Failed to persist registration snapshot:', storageError);
        }
      }
      setRegisterForm(prev => ({ ...prev, password: '' }));
      refreshWalletUsers();
    } catch (error) {
      setRegisterStatus('Unexpected error during registration');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <form className="glass-panel p-4 space-y-4" onSubmit={handleLogin}>
          <div>
            <p className="text-xs uppercase text-white/50">Direct Login</p>
            <h3 className="text-xl font-semibold mt-1">Access an existing workspace</h3>
            <p className="text-sm text-white/50 mt-2">
              Sends credentials straight to <code>/api/auth/login</code>. Use this after registration.
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-white/50">Name</label>
            <input
              className="w-full mt-1 rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
              value={loginForm.name}
              onChange={event => setLoginForm({ ...loginForm, name: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase text-white/50">Password</label>
            <input
              type="password"
              className="w-full mt-1 rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
              value={loginForm.password}
              onChange={event => setLoginForm({ ...loginForm, password: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase text-white/50">Landing role</label>
            <select
              className="w-full mt-1 rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40 text-white bg-slate-900/60"
              value={loginForm.role}
              onChange={event => setLoginForm({ ...loginForm, role: event.target.value })}
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-gradient-to-r from-accent to-accentSecondary py-3 text-sm font-semibold"
          >
            Continue
          </button>
          {loginStatus && <p className="text-xs text-white/70">{loginStatus}</p>}
        </form>

        <form className="glass-panel p-4 space-y-4" onSubmit={handleRegister}>
          <div>
            <p className="text-xs uppercase text-white/50">New Registration</p>
            <h3 className="text-xl font-semibold mt-1">Issue a Fabric identity</h3>
            <p className="text-sm text-white/50 mt-2">
              Calls <code>{registerForm.role === 'admin' ? '/api/auth/enroll' : '/api/auth/register'}</code> and returns
              the hashed credentials required later.
            </p>
          </div>
          <div>
            <label className="text-xs uppercase text-white/50">Name</label>
            <input
              className="w-full mt-1 rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
              value={registerForm.name}
              onChange={event => setRegisterForm({ ...registerForm, name: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase text-white/50">Password</label>
            <input
              type="password"
              className="w-full mt-1 rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40"
              value={registerForm.password}
              onChange={event => setRegisterForm({ ...registerForm, password: event.target.value })}
              required
            />
          </div>
          <div>
            <label className="text-xs uppercase text-white/50">Role</label>
            <select
              className="w-full mt-1 rounded-xl bg-white/5 px-3 py-2 outline-none focus:ring-2 focus:ring-accent/40 text-white bg-slate-900/60"
              value={registerForm.role}
              onChange={event => setRegisterForm({ ...registerForm, role: event.target.value })}
            >
              {roleOptions.map(option => (
                <option key={option.value} value={option.value} className="bg-slate-900 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl border border-accent/40 py-3 text-sm font-semibold hover:bg-accent/10"
          >
            Register Identity
          </button>
          {registerStatus && <p className="text-xs text-white/70">{registerStatus}</p>}

          {registerResult && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-2 text-xs text-white/80">
              <p className="text-[11px] uppercase tracking-[0.3em] text-white/50">Fabric outputs</p>
              {registerResult?.username && (
                <div>
                  <p className="text-white/60">Username</p>
                  <p className="font-mono break-all text-white">{registerResult.username}</p>
                </div>
              )}
              {registerResult?.network_address && (
                <div>
                  <p className="text-white/60">Network Address</p>
                  <p className="font-mono break-all text-accent">{registerResult.network_address}</p>
                </div>
              )}
              {registerResult?.password_hash && (
                <div>
                  <p className="text-white/60">Password Hash (SHA-256)</p>
                  <p className="font-mono break-all text-accentSecondary">{registerResult.password_hash}</p>
                </div>
              )}
              <p className="text-[11px] text-white/40">
                Wallet created: {registerResult?.wallet_created ? 'true' : 'false'} • Role: {registerResult?.role}
              </p>
            </div>
          )}
        </form>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="glass-panel p-4">
          <p className="text-xs text-white/50 uppercase">Fabric Health</p>
          <p className="text-3xl font-semibold mt-2">{health?.status || 'Unknown'}</p>
          <p className="text-xs text-white/40 mt-1">{health?.timestamp || 'No heartbeat'}</p>
        </div>
        <div className="glass-panel p-4 flex flex-col gap-2">
          <p className="text-xs uppercase text-white/50">Ledger Maintenance</p>
          <button className="px-4 py-2 bg-accent/15 text-accent rounded-xl" onClick={initLedger}>
            Initialize Ledger
          </button>
          {initMessage && <p className="text-xs text-white/40">{initMessage}</p>}
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Wallet Registry</h3>
            <p className="text-sm text-white/50">Direct read from file system wallet</p>
          </div>
          <span className="text-xs text-white/40">Identities: {walletUsers.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-white/50">
              <tr>
                <th className="pb-3 font-medium text-left">Label</th>
                <th className="pb-3 font-medium text-left">MSP</th>
                <th className="pb-3 font-medium text-left">Network Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {walletUsers.map((user, index) => (
                <tr key={`${user.label || 'user'}-${index}`}>
                  <td className="py-3">{user.label}</td>
                  <td className="py-3 text-white/60">{user.mspId || 'Org1MSP'}</td>
                  <td className="py-3 font-mono text-xs">{user.network_address || user.label}</td>
                </tr>
              ))}
              {!walletUsers.length && (
                <tr>
                  <td colSpan="3" className="py-6 text-center text-white/30">
                    Wallet empty. Run enrollAdmin/registerUser scripts.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegistrationDashboard;
