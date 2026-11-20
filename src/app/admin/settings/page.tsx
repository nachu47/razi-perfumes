'use client';
import { useEffect, useState, type FormEvent } from 'react';
import a from '@/components/admin/admin.module.css';
import { PageHeader, useAdminApi } from '@/components/admin/ui';
import { useAdminToast } from '@/components/admin/AdminShell';

interface Settings {
  whatsappEnabled: boolean;
  whatsappNumber: string | null;
  whatsappGreetingEn: string;
  whatsappGreetingAr: string;
  paymentProvider: string;
  paymentMethods: string[];
  paymentMode: 'test' | 'live';
}

export default function AdminSettingsPage() {
  const call = useAdminApi();
  const toast = useAdminToast();
  const [s, setS] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void call<Settings>('/api/admin/settings').then(setS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!s) return <div className="spinner" />;

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await call<Settings>('/api/admin/settings', {
      method: 'PUT',
      body: { whatsappEnabled: s.whatsappEnabled, whatsappNumber: s.whatsappNumber ?? '', whatsappGreetingEn: s.whatsappGreetingEn, whatsappGreetingAr: s.whatsappGreetingAr },
    });
    setSaving(false);
    if (res) {
      setS({ ...s, ...res });
      toast('Settings saved');
    }
  };

  const digits = (s.whatsappNumber ?? '').replace(/\D/g, '');

  return (
    <>
      <PageHeader title="Settings" />
      <form onSubmit={save} className={a.panel} style={{ marginTop: 0 }}>
        <div className={a.panelTitle}>WhatsApp enquiries</div>
        <div className={a.form}>
          <label className={a.check}>
            <input type="checkbox" checked={s.whatsappEnabled} onChange={(e) => setS({ ...s, whatsappEnabled: e.target.checked })} />
            Show “Enquire on WhatsApp” on product pages
          </label>
          <div />
          <div className={a.field}>
            <span className={a.label}>WhatsApp number *</span>
            <input className={a.input} value={s.whatsappNumber ?? ''} onChange={(e) => setS({ ...s, whatsappNumber: e.target.value })} placeholder="96550000000" inputMode="tel" />
            <span className={a.help}>Full international number with country code, digits only (e.g. 965 + your number). Customers’ messages go to this WhatsApp.</span>
          </div>
          <div className={a.field}>
            <span className={a.label}>Test</span>
            {digits.length >= 8 ? (
              <a className={a.btnGhost} href={`https://wa.me/${digits}`} target="_blank" rel="noopener" style={{ alignSelf: 'flex-start' }}>
                Open wa.me/{digits} ↗
              </a>
            ) : (
              <span className={a.muted}>Enter a number to test the link.</span>
            )}
          </div>
          <div className={a.field}>
            <span className={a.label}>Message start (English)</span>
            <input className={a.input} value={s.whatsappGreetingEn} onChange={(e) => setS({ ...s, whatsappGreetingEn: e.target.value })} required maxLength={300} />
          </div>
          <div className={a.field}>
            <span className={a.label}>Message start (Arabic)</span>
            <input className={a.input} dir="rtl" value={s.whatsappGreetingAr} onChange={(e) => setS({ ...s, whatsappGreetingAr: e.target.value })} required maxLength={300} />
          </div>
          <p className={`${a.help} ${a.full}`}>The product name, selected size and product link are added after this text automatically. Each enquiry is also saved under Enquiries.</p>
        </div>
        <div className={a.formActions}>
          <button className={a.btnGold} disabled={saving}>
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </div>
      </form>

      <div className={a.panel}>
        <div className={a.panelTitle}>Payments</div>
        <p style={{ fontSize: 13, lineHeight: 1.8 }}>
          Gateway: <strong>{s.paymentProvider === 'myfatoorah' ? 'MyFatoorah' : s.paymentProvider === 'mock' ? 'Sandbox (test only)' : 'None — Cash on Delivery only'}</strong>
          {s.paymentProvider === 'myfatoorah' && (
            <span className={`${a.chip} ${s.paymentMode === 'live' ? a.chipGreen : a.chipGold}`} style={{ marginInlineStart: 8 }}>
              {s.paymentMode === 'live' ? 'LIVE' : 'TEST MODE'}
            </span>
          )}
          <br />
          Methods at checkout: {s.paymentMethods.join(' · ')}
        </p>
        <p className={a.help} style={{ marginTop: 8 }}>
          API keys are secret and are set as environment variables on the server (MYFATOORAH_API_KEY, MYFATOORAH_BASE_URL, PAYMENT_PROVIDER) — see the README.
        </p>
      </div>
    </>
  );
}
