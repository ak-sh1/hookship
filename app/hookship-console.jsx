"use client";

import { useMemo, useState } from "react";

const initialDeliveries = [
  {
    id: "evt_8F2A91",
    event: "order.completed",
    endpoint: "Store API",
    status: "Delivered",
    attempts: 1,
    time: "12 sec ago",
    response: "200 OK",
    payload: '{\n  "order_id": "ord_8421",\n  "total": 129.99,\n  "currency": "CAD"\n}',
  },
  {
    id: "evt_6C7B42",
    event: "customer.created",
    endpoint: "CRM Demo",
    status: "Delivered",
    attempts: 1,
    time: "1 min ago",
    response: "200 OK",
    payload: '{\n  "customer_id": "cus_1048",\n  "plan": "starter"\n}',
  },
  {
    id: "evt_1D9E35",
    event: "invoice.paid",
    endpoint: "Store API",
    status: "Failed",
    attempts: 2,
    time: "4 min ago",
    response: "500 Server Error",
    payload: '{\n  "invoice_id": "inv_7302",\n  "amount": 84.00\n}',
  },
];

const initialEndpoints = [
  { id: 1, name: "Store API", url: "https://example.com/webhooks/orders" },
  { id: 2, name: "CRM Demo", url: "https://example.com/webhooks/customers" },
];

function StatusDot({ status }) {
  return <span className={`status-dot ${status.toLowerCase()}`} aria-hidden="true" />;
}

export default function HookshipConsole() {
  const [deliveries, setDeliveries] = useState(initialDeliveries);
  const [endpoints, setEndpoints] = useState(initialEndpoints);
  const [selectedId, setSelectedId] = useState(initialDeliveries[0].id);
  const [selectedEndpointId, setSelectedEndpointId] = useState(String(initialEndpoints[0].id));
  const [statusFilter, setStatusFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [showEndpointForm, setShowEndpointForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState("");

  const selected = deliveries.find((delivery) => delivery.id === selectedId) ?? deliveries[0] ?? null;

  const filteredDeliveries = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    return deliveries.filter((delivery) => {
      const matchesStatus = statusFilter === "All" || delivery.status === statusFilter;
      const matchesQuery = !normalized || `${delivery.id} ${delivery.event} ${delivery.endpoint}`.toLowerCase().includes(normalized);
      return matchesStatus && matchesQuery;
    });
  }, [deliveries, query, statusFilter]);

  const deliveredCount = deliveries.filter((delivery) => delivery.status === "Delivered").length;
  const failedCount = deliveries.filter((delivery) => delivery.status === "Failed").length;

  async function simulateDelivery(delivery, endpoint) {
    const response = await fetch("/api/test-delivery", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        endpointName: endpoint.name,
        endpointUrl: endpoint.url,
        event: delivery.event,
        data: JSON.parse(delivery.payload),
        attempt: delivery.attempts,
      }),
    });
    if (!response.ok) throw new Error("Simulation failed");
    return response.json();
  }

  async function sendTestEvent() {
    if (sending) return;
    const endpoint = endpoints.find((item) => String(item.id) === selectedEndpointId) ?? endpoints[0];
    if (!endpoint) {
      setToast("Add a destination before sending a test.");
      setShowEndpointForm(true);
      return;
    }

    setSending(true);
    const queued = {
      id: `evt_TEST${String(deliveries.length + 1).padStart(2, "0")}`,
      event: "order.completed",
      endpoint: endpoint.name,
      status: "Queued",
      attempts: 1,
      time: "just now",
      response: "Waiting",
      payload: '{\n  "order_id": "ord_test_01",\n  "total": 42.00,\n  "currency": "CAD"\n}',
    };

    setDeliveries((current) => [queued, ...current]);
    setSelectedId(queued.id);
    setToast(`Sending a test event to ${endpoint.name}…`);

    try {
      const result = await simulateDelivery(queued, endpoint);
      setDeliveries((current) => [result.delivery, ...current.filter((item) => item.id !== queued.id)]);
      setSelectedId(result.delivery.id);
      setToast(`Test delivered to ${endpoint.name}.`);
    } catch {
      const failed = { ...queued, status: "Failed", response: "Simulation unavailable" };
      setDeliveries((current) => current.map((item) => item.id === queued.id ? failed : item));
      setSelectedId(failed.id);
      setToast("The test failed. Open its details to try again.");
    } finally {
      setSending(false);
    }
  }

  async function retryDelivery(delivery) {
    const endpoint = endpoints.find((item) => item.name === delivery.endpoint) ?? endpoints[0];
    if (!endpoint) {
      setToast("Add a destination before retrying this delivery.");
      return;
    }

    const retry = {
      ...delivery,
      status: "Queued",
      attempts: delivery.attempts + 1,
      response: "Trying again",
      time: "just now",
    };
    setDeliveries((current) => current.map((item) => item.id === delivery.id ? retry : item));
    setToast("Retry started.");

    try {
      const result = await simulateDelivery(retry, endpoint);
      const delivered = { ...result.delivery, id: delivery.id };
      setDeliveries((current) => current.map((item) => item.id === delivery.id ? delivered : item));
      setToast("The retry worked.");
    } catch {
      const failed = { ...retry, status: "Failed", response: "Simulation unavailable" };
      setDeliveries((current) => current.map((item) => item.id === delivery.id ? failed : item));
      setToast("The retry failed.");
    }
  }

  function addEndpoint(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = String(form.get("name") || "").trim();
    const url = String(form.get("url") || "").trim();
    if (!name || !url) return;

    const endpoint = { id: Date.now(), name, url };
    setEndpoints((current) => [...current, endpoint]);
    setSelectedEndpointId(String(endpoint.id));
    setShowEndpointForm(false);
    setToast(`${name} was added and selected.`);
    event.currentTarget.reset();
  }

  function confirmDelete() {
    if (!deleteTarget) return;

    if (deleteTarget.kind === "endpoint") {
      const remaining = endpoints.filter((endpoint) => endpoint.id !== deleteTarget.id);
      setEndpoints(remaining);
      if (selectedEndpointId === String(deleteTarget.id)) {
        setSelectedEndpointId(remaining[0] ? String(remaining[0].id) : "");
      }
      setToast(`${deleteTarget.name} was deleted. Past deliveries were kept.`);
    } else {
      const remaining = deliveries.filter((delivery) => delivery.id !== deleteTarget.id);
      setDeliveries(remaining);
      if (selectedId === deleteTarget.id) setSelectedId(remaining[0]?.id ?? "");
      setToast("Delivery deleted.");
    }

    setDeleteTarget(null);
  }

  return (
    <main className="app-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Hookship home"><span className="brand-mark">H</span><span>Hookship</span></a>
        <nav aria-label="Page links"><a href="#how-it-works">How it works</a><a href="#deliveries">Deliveries</a><a className="github-link" href="https://github.com/ak-sh1/hookship" target="_blank" rel="noreferrer">GitHub ↗</a></nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <span className="eyebrow">WEBHOOK DELIVERY SIMULATOR</span>
          <h1>Test webhook deliveries without the guesswork.</h1>
          <p>Choose where the webhook should go, send a test event, and immediately see whether it succeeded or failed.</p>
          <div className="hero-actions">
            <label className="destination-picker">
              <span>Send test to</span>
              <select value={selectedEndpointId} onChange={(event) => setSelectedEndpointId(event.target.value)} disabled={!endpoints.length} aria-label="Choose test destination">
                {endpoints.length ? endpoints.map((endpoint) => <option key={endpoint.id} value={String(endpoint.id)}>{endpoint.name}</option>) : <option value="">No destinations yet</option>}
              </select>
            </label>
            <button className="primary-button" onClick={sendTestEvent} disabled={sending || !endpoints.length}>{sending ? "Sending…" : endpoints.length ? "Send test event" : "Add a destination first"}</button>
            <button className="secondary-button" onClick={() => setShowEndpointForm(true)}>+ Add destination</button>
          </div>
          <span className="demo-note">Demo project: requests are simulated, and changes reset when the page is refreshed.</span>
        </div>

        <div className="hero-preview" aria-label="Example webhook delivery">
          <div className="preview-top"><span>Latest delivery</span><span className="status-pill delivered"><StatusDot status="Delivered" />Delivered</span></div>
          <code>order.completed</code>
          <pre>{'{\n  "order_id": "ord_8421",\n  "total": 129.99\n}'}</pre>
          <div className="preview-result"><span>Response</span><strong>200 OK</strong></div>
        </div>
      </section>

      {toast && <button className="toast" onClick={() => setToast("")} aria-label="Dismiss notification">{toast}<span>×</span></button>}

      <section className="how-section" id="how-it-works">
        <div className="section-heading"><span className="eyebrow">HOW IT WORKS</span><h2>Three simple steps</h2></div>
        <div className="steps">
          <article><span>1</span><div><h3>Add a destination</h3><p>Enter the web address that would receive the webhook. This is also called an endpoint.</p></div></article>
          <article><span>2</span><div><h3>Choose and send</h3><p>Select a destination and send an example event with JSON data.</p></div></article>
          <article><span>3</span><div><h3>Check the result</h3><p>Click a delivery to view its response, payload, retry it, or delete it.</p></div></article>
        </div>
      </section>

      <section className="dashboard" id="deliveries">
        <div className="section-heading dashboard-heading">
          <div><span className="eyebrow">DASHBOARD</span><h2>Webhook activity</h2><p className="section-help">Choose a delivery to see its full details.</p></div>
          <button className="secondary-button" onClick={() => setShowEndpointForm(true)}>+ Add destination</button>
        </div>

        <div className="stats-grid" aria-label="Delivery summary">
          <article><span>Total deliveries</span><strong>{deliveries.length}</strong></article>
          <article><span>Delivered</span><strong className="green-text">{deliveredCount}</strong></article>
          <article><span>Failed</span><strong className="red-text">{failedCount}</strong></article>
          <article><span>Destinations</span><strong>{endpoints.length}</strong></article>
        </div>

        <div className="dashboard-grid">
          <section className="panel endpoint-panel">
            <div className="panel-heading"><div><span className="eyebrow">DESTINATIONS</span><h3>Where webhooks go</h3></div></div>
            <div className="endpoint-list">
              {endpoints.map((endpoint) => (
                <article key={endpoint.id}>
                  <span className="endpoint-icon">↗</span>
                  <div><strong>{endpoint.name}</strong><code>{endpoint.url}</code></div>
                  <button className="delete-icon" onClick={() => setDeleteTarget({ kind: "endpoint", id: endpoint.id, name: endpoint.name })} aria-label={`Delete ${endpoint.name}`} title={`Delete ${endpoint.name}`}>Delete</button>
                </article>
              ))}
              {!endpoints.length && <div className="list-empty"><strong>No destinations yet</strong><span>Add one to send a test event.</span></div>}
            </div>
          </section>

          <section className="panel delivery-panel">
            <div className="panel-heading delivery-panel-heading">
              <div><span className="eyebrow">RECENT DELIVERIES</span><h3>Test events</h3></div>
              <div className="filters">
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search deliveries" aria-label="Search deliveries" />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option>All</option><option>Delivered</option><option>Failed</option><option>Queued</option></select>
              </div>
            </div>

            <div className="delivery-content">
              <div className="delivery-list">
                {filteredDeliveries.map((delivery) => (
                  <button key={delivery.id} className={selected?.id === delivery.id ? "selected" : ""} onClick={() => setSelectedId(delivery.id)}>
                    <span className="delivery-main"><strong>{delivery.event}</strong><small>{delivery.endpoint} · {delivery.time}</small></span>
                    <span className={`status-pill ${delivery.status.toLowerCase()}`}><StatusDot status={delivery.status} />{delivery.status}</span>
                  </button>
                ))}
                {!filteredDeliveries.length && <p className="empty-state">No deliveries match your search.</p>}
              </div>

              {selected ? (
                <aside className="details-panel" aria-label="Selected delivery details">
                  <div className="details-heading">
                    <div><span className="eyebrow">DELIVERY DETAILS</span><h3>{selected.event}</h3></div>
                    <div className="details-actions"><span className={`status-pill ${selected.status.toLowerCase()}`}><StatusDot status={selected.status} />{selected.status}</span><button className="delete-text-button" onClick={() => setDeleteTarget({ kind: "delivery", id: selected.id, name: selected.event })}>Delete</button></div>
                  </div>
                  <dl>
                    <div><dt>Destination</dt><dd>{selected.endpoint}</dd></div>
                    <div><dt>Response</dt><dd>{selected.response}</dd></div>
                    <div><dt>Attempts</dt><dd>{selected.attempts}</dd></div>
                    <div><dt>Event ID</dt><dd><code>{selected.id}</code></dd></div>
                  </dl>
                  <span className="payload-label">JSON payload</span>
                  <pre>{selected.payload}</pre>
                  {selected.status === "Failed" && <button className="retry-button" onClick={() => retryDelivery(selected)}>Retry delivery</button>}
                </aside>
              ) : (
                <aside className="details-panel no-selection" aria-label="Delivery details"><strong>No delivery selected</strong><span>Send a test event to create a delivery.</span></aside>
              )}
            </div>
          </section>
        </div>
      </section>

      <footer><span>Webhook delivery simulator built for learning and demonstration.</span><a href="https://github.com/ak-sh1" target="_blank" rel="noreferrer">Built by Akash ↗</a></footer>

      {showEndpointForm && (
        <div className="modal-backdrop" onMouseDown={() => setShowEndpointForm(false)}>
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="endpoint-title" onMouseDown={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEndpointForm(false)} aria-label="Close dialog">×</button>
            <span className="eyebrow">NEW DESTINATION</span>
            <h2 id="endpoint-title">Add a destination</h2>
            <p>A destination, also called an endpoint, is the web address that would receive the webhook.</p>
            <form onSubmit={addEndpoint}>
              <label>Destination name<input name="name" placeholder="e.g. Store API" required autoFocus /></label>
              <label>HTTPS URL<input name="url" type="url" placeholder="https://example.com/webhooks" pattern="https://.*" required /></label>
              <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setShowEndpointForm(false)}>Cancel</button><button className="primary-button">Add destination</button></div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop" onMouseDown={() => setDeleteTarget(null)}>
          <section className="modal delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className="eyebrow danger-label">CONFIRM DELETE</span>
            <h2 id="delete-title">Delete {deleteTarget.kind === "endpoint" ? "destination" : "delivery"}?</h2>
            <p>{deleteTarget.kind === "endpoint" ? `${deleteTarget.name} will be removed. Its past deliveries will stay in the history.` : `${deleteTarget.name} will be permanently removed from this demo.`}</p>
            <div className="modal-actions"><button className="secondary-button" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="danger-button" onClick={confirmDelete}>Delete</button></div>
          </section>
        </div>
      )}
    </main>
  );
}
