"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { Button } from "@/components/button";
import { Toast } from "@/components/toast";
import Link from "next/link";
import { getStoredUser } from "@/lib/auth";

export default function BlockedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reasonRaw = decodeURIComponent(searchParams.get('reason') || 'Your account is under review.');
  const kind = searchParams.get('kind') || '';
  const isPending = /under review|pending/i.test(reasonRaw);
  const isRejected = /rejected/i.test(reasonRaw) || kind === 'account_rejected';
  const isSubscription = /subscription/i.test(reasonRaw) && !isPending && !isRejected;
  const heading = isPending ? 'Account Under Review' : (isRejected ? 'Access Restricted' : (isSubscription ? 'Subscription Required' : 'Access Blocked'));
  const helper = isPending
    ? "Your account is under review. We'll notify you once it's approved. You can contact support below."
    : (isRejected
        ? 'Your account is currently not approved. If you believe this is a mistake, please contact support.'
        : 'Please renew your subscription to continue using the dashboard.');
  const reason = reasonRaw;
  const email = searchParams.get('email') || '';

  const supportEmail = 'support@badehy.com';
  const whatsappNumber = '201287235491';

  const [formData, setFormData] = useState({
    name: '',
    email: email || '',
    subject: isPending ? 'Account under review' : 'Account access assistance',
    message: isPending
      ? `Hello Support,\n\nMy account is under review. Please let me know the next steps.\n\nReason: ${reason}`
      : `Hello Support,\n\nPlease assist me with my account access.\n\nReason: ${reason}`,
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [checking, setChecking] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(() => setSent(false), 3000);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.error || 'Failed to send request');
      }
    } catch (e) {
      alert('Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      setChecking(true);
      let storedUser = getStoredUser();
      let targetId = storedUser?.isTeamMember ? storedUser?.trainerId : storedUser?.id;
      // Fallback: derive id by email from query string if local storage is empty
      if (!targetId) {
        const emailFromQuery = searchParams.get('email') || '';
        if (emailFromQuery) {
          try {
            const listRes = await fetch('/api/check-users', { cache: 'no-store' });
            const list = await listRes.json().catch(() => ({}));
            const match = Array.isArray(list?.users) ? list.users.find((u: any) => (u.email || '').toLowerCase() === emailFromQuery.toLowerCase()) : null;
            if (match?.id) {
              targetId = match.id;
              storedUser = { id: match.id, email: match.email, fullName: match.fullName } as any;
            }
          } catch {}
        }
      }
      if (!targetId) return;
      const res = await fetch(`/api/clients/profile/${targetId}`, { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));
      const account = (data?.accountStatus || 'approved').toLowerCase();
      const sub = (data?.subscriptionStatus || 'active').toLowerCase();
      // Redirect rules depend on what blocked us
      if (kind.startsWith('account_')) {
        if (account === 'approved') router.push('/');
      } else if (kind.startsWith('subscription_')) {
        if (sub === 'active') router.push('/');
      } else {
        // Fallback: require both approved and active
        if (account === 'approved' && sub === 'active') router.push('/');
      }
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    // Immediate one-time check; avoid repeated polling that can cause perceived loops
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-6 bg-white p-8 rounded-xl border border-zinc-200 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-zinc-900">{heading}</h1>
          {/* Remove the secondary reason line under the title to keep copy concise */}
          <p className="mt-1 text-zinc-600">{helper}</p>
        </div>

        <Toast
          open={sent}
          message="Thank you! Your message has been sent. We'll get back to you soon."
          type="success"
          onClose={() => setSent(false)}
        />

        <div className="space-y-3">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input name="name" placeholder="Your name" value={formData.name} onChange={handleChange} required />
            <Input name="email" type="email" placeholder="your.email@example.com" value={formData.email} onChange={handleChange} required />
            <Input name="subject" placeholder="Subject" value={formData.subject} onChange={handleChange} required />
            <Textarea name="message" rows={4} value={formData.message} onChange={handleChange} required />
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Sending…' : (sent ? 'Sent' : 'Send to Support')}</Button>
          </form>
          {/* Retry button removed per request */}
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^\d]/g, '')}?text=${encodeURIComponent((isPending ? 'Hello, my account is under review.' : 'Hello, I need help with my account access.') + ' My email: ' + email)}`}
            target="_blank" rel="noopener noreferrer"
            className="block w-full text-center px-4 py-2 rounded-lg border border-green-200 text-green-700 hover:bg-green-50"
          >
            Contact via WhatsApp
          </a>
        </div>

        {/* <div className="text-center text-sm text-zinc-500">
          <Link href="/auth/login" className="hover:underline">Back to Login</Link>
        </div> */}
      </div>
    </div>
  );
}


