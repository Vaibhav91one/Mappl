"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppwriteException } from 'appwrite';
import { ping } from '@/lib/appwrite';

export default function AppwriteCheck() {
  const [logs, setLogs] = useState<Array<{ date: Date; method: string; path: string; status: number; response: string }>>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const detailsRef = useRef<HTMLDetailsElement | null>(null);
  const [detailHeight, setDetailHeight] = useState(55);
  const [showLogs, setShowLogs] = useState(false);

  const updateHeight = useCallback(() => {
    if (detailsRef.current) setDetailHeight(detailsRef.current.clientHeight);
  }, []);

  useEffect(() => {
    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, [updateHeight]);

  useEffect(() => {
    if (!detailsRef.current) return;
    const el = detailsRef.current;
    el.addEventListener('toggle', updateHeight);
    return () => el.removeEventListener('toggle', updateHeight);
  }, [updateHeight]);

  async function sendPing() {
    if (status === 'loading') return;
    setStatus('loading');
    try {
      const result = await ping();
      const log = {
        date: new Date(),
        method: 'GET',
        path: '/health/version',
        status: 200,
        response: JSON.stringify(result),
      };
      setLogs((prev) => [log, ...prev]);
      setStatus('success');
    } catch (err: unknown) {
      const appErr = err as AppwriteException;
      const log = {
        date: new Date(),
        method: 'GET',
        path: '/health/version',
        status: appErr?.code || 500,
        response: appErr?.message || 'Something went wrong',
      };
      setLogs((prev) => [log, ...prev]);
      setStatus('error');
    }
    setShowLogs(true);
  }

  return (
    <main className="flex flex-col items-center p-5" style={{ marginBottom: `${detailHeight}px` }}>
      <section className="mt-12 flex h-52 flex-col items-center">
        {status === 'loading' ? (
          <div className="flex flex-row gap-4">
            <span>Waiting for connection...</span>
          </div>
        ) : status === 'success' ? (
          <h1 className="text-2xl">Connected</h1>
        ) : (
          <h1 className="text-2xl">Check connection</h1>
        )}

        <p className="mt-2 mb-8">
          {status === 'success' ? (
            <span>You connected your app successfully.</span>
          ) : status === 'error' || status === 'idle' ? (
            <span>Send a ping to verify the connection</span>
          ) : null}
        </p>

        <button onClick={sendPing} className={`rounded bg-black px-3 py-2 text-white ${status === 'loading' ? 'opacity-50' : ''}`}>Send a ping</button>
      </section>

      <aside className="fixed bottom-0 flex w-full cursor-pointer border-t border-gray-200 bg-white">
        <details open={showLogs} ref={detailsRef} className={"w-full"}>
          <summary className="flex w-full flex-row justify-between p-4 marker:content-none">
            <div className="flex gap-2">
              <span className="font-semibold">Logs</span>
              {logs.length > 0 && (
                <div className="flex items-center rounded-md bg-gray-100 px-2">
                  <span className="font-semibold">{logs.length}</span>
                </div>
              )}
            </div>
          </summary>
          <div className="flex w-full flex-col">
            <div className="flex-grow">
              <table className="w-full">
                <thead>
                  <tr className="border-y bg-gray-50 text-gray-500">
                    {logs.length > 0 ? (
                      <>
                        <td className="w-52 py-2 pl-4">Date</td>
                        <td>Status</td>
                        <td>Method</td>
                        <td className="hidden lg:table-cell">Path</td>
                        <td className="hidden lg:table-cell">Response</td>
                      </>
                    ) : (
                      <>
                        <td className="py-2 pl-4">Logs</td>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {logs.length > 0 ? (
                    logs.map((log, index) => (
                      <tr key={`log-${index}-${log.date.getTime()}`}>
                        <td className="py-2 pl-4">{log.date.toLocaleString()}</td>
                        <td>{log.status}</td>
                        <td>{log.method}</td>
                        <td className="hidden lg:table-cell">{log.path}</td>
                        <td className="hidden lg:table-cell">{log.response}</td>
                      </tr>
                    ))
                  ) : (
                    <tr key="no-logs">
                      <td className="py-2 pl-4">There are no logs to show</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      </aside>
    </main>
  );
}
