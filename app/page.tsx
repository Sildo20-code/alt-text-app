'use client';

import { useState } from 'react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResult('');
    setCopied(false);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Something went wrong');
      }

      setResult(data.result || '');
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUrl('');
    setResult('');
    setError('');
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!result) return;

    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError('Could not copy the result.');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background:
          'radial-gradient(circle at top, rgba(30,41,59,1) 0%, rgba(15,23,42,1) 45%, rgba(2,6,23,1) 100%)',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '760px',
          background: 'rgba(15, 23, 42, 0.92)',
          borderRadius: '20px',
          padding: '32px',
          boxShadow: '0 20px 60px rgba(2, 6, 23, 0.45)',
          border: '1px solid rgba(148, 163, 184, 0.16)',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '12px',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#94a3b8',
              fontWeight: 700,
            }}
          >
            OpenAI Powered
          </p>
          <h1 style={{ margin: '10px 0 8px', fontSize: '34px', color: '#f8fafc' }}>
            Alt Text Generator
          </h1>
          <p style={{ margin: 0, color: '#cbd5e1', lineHeight: 1.6 }}>
            Paste a product URL and generate short, SEO-friendly Greek alt text.
          </p>
        </div>

        <label
          htmlFor="url"
          style={{
            display: 'block',
            marginBottom: '8px',
            fontWeight: 600,
            color: '#e2e8f0',
          }}
        >
          Product URL
        </label>

        <input
          id="url"
          type="text"
          placeholder="https://example.com/product-page"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: '16px',
            border: '1px solid #334155',
            borderRadius: '12px',
            outline: 'none',
            boxSizing: 'border-box',
            background: '#0f172a',
            color: '#f8fafc',
          }}
        />

        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            marginTop: '16px',
          }}
        >
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: '12px 18px',
              fontSize: '15px',
              border: 'none',
              borderRadius: '12px',
              background: loading ? '#94a3b8' : '#0f172a',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>

          <button
            onClick={handleCopy}
            disabled={!result}
            style={{
              padding: '12px 18px',
              fontSize: '15px',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              background: result ? '#111827' : '#0f172a',
              color: result ? '#f8fafc' : '#64748b',
              cursor: result ? 'pointer' : 'not-allowed',
              fontWeight: 600,
            }}
          >
            {copied ? 'Copied' : 'Copy result'}
          </button>

          <button
            onClick={handleClear}
            disabled={loading && !url && !result && !error}
            style={{
              padding: '12px 18px',
              fontSize: '15px',
              border: '1px solid #334155',
              borderRadius: '12px',
              background: '#111827',
              color: '#e2e8f0',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Clear
          </button>
        </div>

        {error ? (
          <div
            style={{
              marginTop: '18px',
              padding: '14px 16px',
              borderRadius: '12px',
              background: 'rgba(127, 29, 29, 0.2)',
              border: '1px solid rgba(248, 113, 113, 0.45)',
              color: '#fecaca',
            }}
          >
            {error}
          </div>
        ) : null}

        <div
          style={{
            marginTop: '24px',
            padding: '18px',
            border: '1px solid #334155',
            borderRadius: '16px',
            background: '#0f172a',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>Generated Alt Text</h2>
            {loading ? (
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Generating...</span>
            ) : null}
          </div>

          <p
            style={{
              margin: 0,
              minHeight: '48px',
              color: result ? '#e2e8f0' : '#94a3b8',
              lineHeight: 1.7,
              whiteSpace: 'pre-wrap',
            }}
          >
            {result || 'Your generated alt text will appear here.'}
          </p>
        </div>
      </section>
    </main>
  );
}
