'use client';

import { useState } from 'react';

type HistoryItem = {
  id: number;
  url: string;
  result: string;
};

const featureItems = [
  {
    title: 'SEO optimized',
    description: 'Generate alt text designed to support search visibility and stronger product metadata.',
  },
  {
    title: 'Greek language support',
    description: 'Create natural, fluent Greek alt text that feels polished and ecommerce-ready.',
  },
  {
    title: 'Fast and simple',
    description: 'Paste a URL, click once, and get a clean result you can copy instantly.',
  },
];

const steps = [
  'Paste product URL',
  'Click Generate',
  'Copy result',
];

export default function Home() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);

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

      const nextResult = data.result || '';
      setResult(nextResult);
      setHistory((current) => [
        {
          id: Date.now(),
          url,
          result: nextResult,
        },
        ...current,
      ]);
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
      setError('Could not copy the generated alt text. Please try again.');
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background:
          'radial-gradient(circle at top, rgba(56,189,248,0.16) 0%, rgba(15,23,42,1) 24%, rgba(2,6,23,1) 100%)',
        color: '#f8fafc',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '1180px',
          margin: '0 auto',
          padding: '32px 20px 72px',
          boxSizing: 'border-box',
        }}
      >
        <section
          style={{
            display: 'grid',
            justifyItems: 'center',
            textAlign: 'center',
            gap: '18px',
            padding: '48px 0 32px',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '999px',
              border: '1px solid rgba(96, 165, 250, 0.28)',
              background: 'rgba(37, 99, 235, 0.14)',
              color: '#bfdbfe',
              fontSize: '13px',
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            Modern AI Workflow
          </div>

          <div style={{ maxWidth: '860px', display: 'grid', gap: '14px' }}>
            <h1
              style={{
                margin: 0,
                fontSize: 'clamp(42px, 7vw, 76px)',
                lineHeight: 0.97,
                fontWeight: 800,
                letterSpacing: '-0.05em',
              }}
            >
              AI Alt Text Generator for E-commerce
            </h1>

            <p
              style={{
                margin: 0,
                fontSize: 'clamp(18px, 2vw, 22px)',
                lineHeight: 1.7,
                color: '#94a3b8',
              }}
            >
              Generate SEO-friendly alt text for product images in seconds
            </p>
          </div>
        </section>

        <section
          data-grid="app"
          style={{
            display: 'grid',
            gap: '28px',
            alignItems: 'start',
            gridTemplateColumns: '1.15fr 0.85fr',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(15,23,42,0.94) 0%, rgba(15,23,42,0.88) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.14)',
              borderRadius: '28px',
              padding: '32px',
              boxShadow: '0 24px 80px rgba(2, 6, 23, 0.55)',
              backdropFilter: 'blur(18px)',
              display: 'grid',
              gap: '24px',
            }}
          >
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ fontSize: '13px', color: '#60a5fa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Generator
              </div>
              <h2 style={{ margin: 0, fontSize: '32px', lineHeight: 1.1 }}>
                Turn product URLs into polished Greek alt text
              </h2>
              <p style={{ margin: 0, color: '#94a3b8', lineHeight: 1.75, fontSize: '16px' }}>
                Built for ecommerce teams that need fast, descriptive, SEO-aware product image text.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '10px' }}>
              <label
                htmlFor="url"
                style={{
                  display: 'block',
                  color: '#e2e8f0',
                  fontWeight: 600,
                  fontSize: '15px',
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
                  padding: '16px 18px',
                  fontSize: '16px',
                  borderRadius: '16px',
                  border: '1px solid #334155',
                  background: 'rgba(2, 6, 23, 0.72)',
                  color: '#f8fafc',
                  outline: 'none',
                  boxSizing: 'border-box',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <button
                onClick={handleSubmit}
                disabled={loading}
                style={{
                  padding: '14px 20px',
                  fontSize: '15px',
                  border: '1px solid rgba(96, 165, 250, 0.35)',
                  borderRadius: '14px',
                  background: loading
                    ? 'linear-gradient(135deg, #64748b 0%, #475569 100%)'
                    : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                  color: '#fff',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: loading ? 'none' : '0 14px 36px rgba(37, 99, 235, 0.30)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease',
                }}
              >
                {loading ? (
                  <span
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '999px',
                      border: '2px solid rgba(255,255,255,0.35)',
                      borderTopColor: '#ffffff',
                      animation: 'spin 0.8s linear infinite',
                      display: 'inline-block',
                    }}
                  />
                ) : null}
                {loading ? 'Generating...' : 'Generate'}
              </button>

              <button
                onClick={handleCopy}
                disabled={!result}
                style={{
                  padding: '14px 18px',
                  fontSize: '15px',
                  border: '1px solid rgba(148, 163, 184, 0.22)',
                  borderRadius: '14px',
                  background: result ? 'rgba(15, 23, 42, 0.88)' : 'rgba(15, 23, 42, 0.55)',
                  color: result ? '#f8fafc' : '#64748b',
                  cursor: result ? 'pointer' : 'not-allowed',
                  fontWeight: 600,
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                {copied ? 'Copied!' : 'Copy result'}
              </button>

              <button
                onClick={handleClear}
                disabled={loading && !url && !result && !error}
                style={{
                  padding: '14px 18px',
                  fontSize: '15px',
                  border: '1px solid rgba(148, 163, 184, 0.22)',
                  borderRadius: '14px',
                  background: 'rgba(15, 23, 42, 0.88)',
                  color: '#e2e8f0',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                }}
              >
                Clear
              </button>
            </div>

            {error ? (
              <div
                style={{
                  padding: '14px 16px',
                  borderRadius: '14px',
                  background: 'rgba(127, 29, 29, 0.2)',
                  border: '1px solid rgba(248, 113, 113, 0.45)',
                  color: '#fecaca',
                  display: 'grid',
                  gap: '6px',
                }}
              >
                <strong style={{ fontSize: '14px' }}>Something went wrong</strong>
                <span>{error}</span>
              </div>
            ) : null}

            <div
              style={{
                padding: '22px',
                border: '1px solid rgba(71, 85, 105, 0.65)',
                borderRadius: '18px',
                background:
                  'linear-gradient(180deg, rgba(15,23,42,0.88) 0%, rgba(2,6,23,0.92) 100%)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc' }}>
                  Generated Alt Text
                </h2>
                <span style={{ fontSize: '14px', color: '#94a3b8' }}>
                  {loading ? 'Working on your result...' : 'Ready'}
                </span>
              </div>

              <p
                style={{
                  margin: 0,
                  minHeight: '72px',
                  color: result ? '#e2e8f0' : '#94a3b8',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-wrap',
                  fontSize: '16px',
                }}
              >
                {result || 'Your generated alt text will appear here.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '20px' }}>
            <div
              style={{
                background: 'rgba(15, 23, 42, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.14)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 18px 50px rgba(2, 6, 23, 0.32)',
              }}
            >
              <h3 style={{ margin: '0 0 18px', fontSize: '20px' }}>Features</h3>
              <div style={{ display: 'grid', gap: '14px' }}>
                {featureItems.map((feature) => (
                  <div
                    key={feature.title}
                    style={{
                      padding: '16px',
                      borderRadius: '16px',
                      background: 'rgba(2, 6, 23, 0.36)',
                      border: '1px solid rgba(51, 65, 85, 0.72)',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: '#f8fafc', marginBottom: '6px' }}>
                      {feature.title}
                    </div>
                    <div style={{ color: '#94a3b8', lineHeight: 1.7, fontSize: '14px' }}>
                      {feature.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                background: 'rgba(15, 23, 42, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.14)',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 18px 50px rgba(2, 6, 23, 0.32)',
              }}
            >
              <h3 style={{ margin: '0 0 18px', fontSize: '20px' }}>How it works</h3>
              <div style={{ display: 'grid', gap: '14px' }}>
                {steps.map((step, index) => (
                  <div
                    key={step}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '42px 1fr',
                      gap: '14px',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '999px',
                        display: 'grid',
                        placeItems: 'center',
                        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                        color: '#ffffff',
                        fontWeight: 800,
                        boxShadow: '0 10px 24px rgba(37, 99, 235, 0.28)',
                      }}
                    >
                      {index + 1}
                    </div>
                    <div
                      style={{
                        padding: '14px 16px',
                        borderRadius: '16px',
                        background: 'rgba(2, 6, 23, 0.36)',
                        border: '1px solid rgba(51, 65, 85, 0.72)',
                        color: '#e2e8f0',
                        fontWeight: 600,
                      }}
                    >
                      {step}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          style={{
            marginTop: '28px',
            display: 'grid',
            gap: '18px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <h2 style={{ margin: 0, fontSize: '24px' }}>Recent History</h2>
            <span style={{ fontSize: '14px', color: '#94a3b8' }}>
              {history.length} item{history.length === 1 ? '' : 's'}
            </span>
          </div>

          {history.length === 0 ? (
            <div
              style={{
                padding: '22px',
                borderRadius: '20px',
                background: 'rgba(15, 23, 42, 0.72)',
                border: '1px solid rgba(148, 163, 184, 0.14)',
                color: '#94a3b8',
                lineHeight: 1.8,
              }}
            >
              Your latest generated results will appear here.
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gap: '14px',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              }}
            >
              {history.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '18px',
                    borderRadius: '20px',
                    border: '1px solid rgba(148, 163, 184, 0.14)',
                    background: 'rgba(15, 23, 42, 0.72)',
                    boxShadow: '0 14px 40px rgba(2, 6, 23, 0.28)',
                    display: 'grid',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      color: '#60a5fa',
                      fontSize: '13px',
                      lineHeight: 1.5,
                      wordBreak: 'break-all',
                    }}
                  >
                    {item.url}
                  </span>
                  <span
                    style={{
                      color: '#e2e8f0',
                      lineHeight: 1.7,
                    }}
                  >
                    {item.result}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <style jsx>{`
          button:hover {
            transform: translateY(-1px);
            filter: brightness(1.04);
          }

          button:disabled:hover {
            transform: none;
            filter: none;
          }

          @media (max-width: 980px) {
            section[data-grid='app'] {
              grid-template-columns: 1fr;
            }
          }

          @keyframes spin {
            from {
              transform: rotate(0deg);
            }
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    </main>
  );
}
