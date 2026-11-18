/* UGN Media public lifetime DVD play counters.
   Read endpoints do not increment. Only INSERT & PLAY records events.
   Public third-party API; no secrets or personal identifiers are transmitted by this script.
*/
const API_BASE = 'https://countapi.mileshilliard.com/api/v1';
const PREFIX = 'ugn_media_dvd_20261118_';
const keyFor = id => id === 'any' ? PREFIX + 'total' : PREFIX + 'disc_' + id;
const numberFormatter = new Intl.NumberFormat('en-US');
const validDiscId = id => id === 'uploads' || /^[A-Za-z0-9_-]{11}$/.test(id || '');

export class PlayMetrics {
  constructor() {
    this.total = null;
    this.totalFetchedAt = 0;
    this.totalPending = null;
    this.counts = new Map();
    this.pending = new Map();
    this.rows = new Map();
    this.queue = [];
    this.queued = new Set();
    this.activeReads = 0;
    this.caseId = null;
    this.observer = 'IntersectionObserver' in window
      ? new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          this.observer.unobserve(entry.target);
          this.enqueue(entry.target.dataset.playId);
        }
      }, {root: document.getElementById('video-list'), rootMargin: '100px 0px'})
      : null;
  }

  async request(id, increment = false) {
    const operation = increment ? 'hit' : 'get';
    const url = `${API_BASE}/${operation}/${encodeURIComponent(keyFor(id))}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 9000);
    try {
      const response = await fetch(url, {
        cache: 'no-store',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
        keepalive: increment
      });
      // Newly created collections have no keys yet; show zero instead of an error.
      if (!increment && response.status === 404) return 0;
      if (!response.ok) throw new Error(`Counter service HTTP ${response.status}`);
      const data = await response.json();
      const n = Number(data?.value);
      if (!Number.isSafeInteger(n) || n < 0) throw new Error('Unexpected play-count response');
      return n;
    } finally {
      clearTimeout(timeout);
    }
  }

  paintTotal() {
    const el = document.getElementById('total-play-count');
    if (!el) return;
    el.textContent = this.total === null ? '—' : numberFormatter.format(this.total);
    el.title = this.total === null ? 'Counter unavailable. Your DVDs still work.' : `${numberFormatter.format(this.total)} recorded DVD play actions since tracking began`;
  }

  loadTotal(force = false) {
    if (this.totalPending) return this.totalPending;
    if (!force && this.totalFetchedAt && Date.now() - this.totalFetchedAt < 30000) return Promise.resolve(this.total);
    this.totalPending = this.request('any').then(n => {
      this.total = n;
      this.totalFetchedAt = Date.now();
      this.paintTotal();
      return n;
    }).catch(error => {
      console.info('UGN Media lifetime counter unavailable:', error.message);
      this.paintTotal();
      return null;
    }).finally(() => {this.totalPending = null;});
    return this.totalPending;
  }

  startRows() {
    this.rows.clear();
    this.observer?.disconnect();
  }

  addRow(id, element) {
    if (!validDiscId(id)) return;
    element.dataset.playId = id;
    this.rows.set(id, element);
    this.paintOne(id);
    if (this.counts.has(id)) return;
    if (this.observer) this.observer.observe(element);
    else this.enqueue(id);
  }

  paintOne(id) {
    const n = this.counts.get(id);
    const label = n === undefined ? '… PLAYS' : `${numberFormatter.format(n)} ${n === 1 ? 'PLAY' : 'PLAYS'}`;
    const row = this.rows.get(id);
    if (row?.isConnected) row.textContent = `▶ ${label}`;
    if (this.caseId === id) {
      const detail = document.getElementById('case-play-count');
      if (detail) detail.textContent = `▶ ${label}`;
    }
  }

  enqueue(id) {
    if (!validDiscId(id) || this.counts.has(id) || this.queued.has(id) || this.pending.has(id)) return;
    this.queued.add(id);
    this.queue.push(id);
    this.drain();
  }

  drain() {
    while (this.activeReads < 2 && this.queue.length) {
      const id = this.queue.shift();
      this.queued.delete(id);
      if (this.counts.has(id)) continue;
      this.activeReads++;
      this.readOne(id).finally(() => {this.activeReads--; this.drain();});
    }
  }

  readOne(id) {
    if (!validDiscId(id)) return Promise.resolve(null);
    if (this.pending.has(id)) return this.pending.get(id);
    const work = this.request(id).then(n => {
      this.counts.set(id, n);
      this.paintOne(id);
      return n;
    }).catch(error => {
      console.info('UGN Media disc counter unavailable:', error.message);
      const row = this.rows.get(id);
      if (row?.isConnected) row.textContent = '▶ — PLAYS';
      if (this.caseId === id) {
        const detail = document.getElementById('case-play-count');
        if (detail) detail.textContent = '▶ — PLAYS';
      }
      return null;
    }).finally(() => this.pending.delete(id));
    this.pending.set(id, work);
    return work;
  }

  select(id) {
    this.caseId = id;
    const detail = document.getElementById('case-play-count');
    if (detail) detail.textContent = '▶ … PLAYS';
    this.paintOne(id);
    if (!this.counts.has(id)) void this.readOne(id);
  }

  async recordPlay(id) {
    if (!validDiscId(id)) return;
    // Two stable public counters: one for this disc and one for the entire archive.
    // Their increments are independent. Reading the menu or case never increments.
    const [disc, total] = await Promise.allSettled([
      this.request(id, true),
      this.request('any', true)
    ]);
    if (disc.status === 'fulfilled') {
      this.counts.set(id, disc.value);
      this.paintOne(id);
    } else {
      console.warn('UGN Media per-disc play count unavailable:', disc.reason);
    }
    if (total.status === 'fulfilled') {
      this.total = total.value;
      this.totalFetchedAt = Date.now();
      this.paintTotal();
    } else {
      console.warn('UGN Media total play count unavailable:', total.reason);
    }
  }
}
