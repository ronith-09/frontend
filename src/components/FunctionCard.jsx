import { useEffect, useMemo, useState } from 'react';
import client from '../services/apiClient';

const sanitizeValues = values => {
  const sanitized = {};
  Object.entries(values).forEach(([key, value]) => {
    if (value !== '' && value !== undefined && value !== null) {
      sanitized[key] = value;
    }
  });
  return sanitized;
};

const FunctionCard = ({
  title,
  description,
  method = 'GET',
  endpoint,
  fields = [],
  buildRequest
}) => {
  const initialValues = useMemo(
    () =>
      fields.reduce((acc, field) => {
        acc[field.name] = field.defaultValue ?? '';
        return acc;
      }, {}),
    [fields]
  );

  const [values, setValues] = useState(initialValues);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setResponse(null);

    try {
      const cleanedValues = sanitizeValues(values);
      const requestOverrides = buildRequest ? buildRequest(cleanedValues, values) : {};

      const requestConfig = {
        method,
        url: endpoint,
        ...requestOverrides
      };

      const verb = (requestConfig.method || method || 'GET').toUpperCase();
      requestConfig.method = verb;

      if (verb === 'GET') {
        requestConfig.params = requestConfig.params ?? cleanedValues;
      } else {
        requestConfig.data = requestConfig.data ?? cleanedValues;
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

  const handleReset = () => {
    setValues(initialValues);
    setResponse(null);
    setError('');
  };

  const renderField = field => {
    const commonProps = {
      id: `${title}-${field.name}`,
      value: values[field.name],
      onChange: event => handleChange(field.name, event.target.value),
      placeholder: field.placeholder,
      required: field.required,
      className:
        'mt-1 w-full rounded-xl bg-white/5 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent/40',
      name: field.name
    };

    if (field.options?.length) {
      return (
        <select {...commonProps}>
          {field.options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === 'textarea') {
      return <textarea {...commonProps} rows={field.rows || 3} />;
    }

    return <input {...commonProps} type={field.type || 'text'} />;
  };

  const formattedResponse =
    typeof response === 'string' ? response : response ? JSON.stringify(response, null, 2) : '';

  return (
    <form onSubmit={handleSubmit} className="glass-panel p-4 space-y-4 border border-white/5">
      <div className="space-y-1">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/50">{title}</p>
        <h3 className="text-lg font-semibold">{method.toUpperCase()} {endpoint}</h3>
        {description && <p className="text-sm text-white/60">{description}</p>}
      </div>

      <div className="grid gap-3">
        {fields.map(field => (
          <label key={field.name} className="block text-sm">
            <span className="text-[11px] uppercase text-white/40 tracking-wide">{field.label}</span>
            {renderField(field)}
            {field.helper && <p className="text-xs text-white/50 mt-1">{field.helper}</p>}
          </label>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isLoading}
          className="flex-1 rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-accent/90 disabled:opacity-50"
        >
          {isLoading ? 'Submitting...' : 'Send request'}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 hover:bg-white/5"
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {formattedResponse && (
        <pre className="max-h-60 overflow-auto rounded-xl bg-black/30 p-3 text-xs text-white/80">
          {formattedResponse}
        </pre>
      )}
    </form>
  );
};

export default FunctionCard;
