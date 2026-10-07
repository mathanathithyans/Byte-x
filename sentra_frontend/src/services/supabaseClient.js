/**
 * Lightweight, zero-dependency Supabase Client for SENTRA-X
 * Directly connects to Supabase REST & PostgREST API with identical syntax.
 */

export class SupabaseQueryBuilder {
  constructor(url, key, table) {
    this.url = url;
    this.key = key;
    this.table = table;
    this.endpoint = `${url}/rest/v1/${table}`;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    this.queryParams = [];
  }

  select(columns = '*') {
    this.queryParams.push(`select=${encodeURIComponent(columns)}`);
    return this;
  }

  eq(column, value) {
    this.queryParams.push(`${encodeURIComponent(column)}=eq.${encodeURIComponent(value)}`);
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.queryParams.push(`order=${encodeURIComponent(column)}.${ascending ? 'asc' : 'desc'}`);
    return this;
  }

  limit(count) {
    this.queryParams.push(`limit=${count}`);
    return this;
  }

  async execute() {
    const q = this.queryParams.length ? `?${this.queryParams.join('&')}` : '';
    const res = await fetch(`${this.endpoint}${q}`, {
      method: 'GET',
      headers: this.headers
    });
    if (!res.ok) {
      const err = await res.text();
      return { data: null, error: new Error(err) };
    }
    const data = await res.json();
    return { data, error: null };
  }

  async insert(record) {
    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      const err = await res.text();
      return { data: null, error: new Error(err) };
    }
    const data = await res.json();
    return { data, error: null };
  }

  async update(record) {
    const q = this.queryParams.length ? `?${this.queryParams.join('&')}` : '';
    const res = await fetch(`${this.endpoint}${q}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(record)
    });
    if (!res.ok) {
      const err = await res.text();
      return { data: null, error: new Error(err) };
    }
    const data = await res.json();
    return { data, error: null };
  }

  async delete() {
    const q = this.queryParams.length ? `?${this.queryParams.join('&')}` : '';
    const res = await fetch(`${this.endpoint}${q}`, {
      method: 'DELETE',
      headers: this.headers
    });
    if (!res.ok) {
      const err = await res.text();
      return { data: null, error: new Error(err) };
    }
    return { error: null };
  }
}

export function createClient(supabaseUrl, supabaseKey) {
  if (!supabaseUrl || !supabaseKey) return null;
  return {
    from(table) {
      return new SupabaseQueryBuilder(supabaseUrl, supabaseKey, table);
    },
    table(table) {
      return new SupabaseQueryBuilder(supabaseUrl, supabaseKey, table);
    },
    auth: {
      async getUser() {
        return { data: { user: { role: 'authenticated' } }, error: null };
      }
    }
  };
}
