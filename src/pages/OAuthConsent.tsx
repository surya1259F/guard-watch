import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type OAuthDetails = { client?: { name?: string; uri?: string }; redirect_url?: string; redirect_to?: string };

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!authorizationId) { setError("This authorization request is missing its ID."); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        const next = `${window.location.pathname}${window.location.search}`;
        window.location.href = `/`;
        sessionStorage.setItem("securepatrol_oauth_next", next);
        return;
      }
      const oauth = supabase.auth as typeof supabase.auth & { oauth?: { getAuthorizationDetails: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }> } };
      const result = await oauth.oauth?.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (!result || result.error) setError(result?.error.message ?? "Could not load the authorization request.");
      else setDetails(result.data);
    };
    void load();
    return () => { active = false; };
  }, [authorizationId]);

  const decide = async (approve: boolean) => {
    setBusy(true);
    const oauth = supabase.auth as typeof supabase.auth & { oauth?: { approveAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }>; denyAuthorization: (id: string) => Promise<{ data: OAuthDetails | null; error: { message: string } | null }> } };
    const result = await (approve ? oauth.oauth?.approveAuthorization(authorizationId) : oauth.oauth?.denyAuthorization(authorizationId));
    if (!result || result.error) { setError(result?.error.message ?? "Unable to complete this request."); setBusy(false); return; }
    const target = result.data?.redirect_url ?? result.data?.redirect_to;
    if (target) window.location.href = target;
    else { setError("The authorization server returned no destination."); setBusy(false); }
  };

  return <main className="grid-lines flex min-h-screen items-center justify-center p-6">
    <section className="w-full max-w-md border border-border bg-card p-8 shadow-2xl">
      <div className="mb-8 flex items-center gap-3"><div className="flex size-11 items-center justify-center bg-primary text-primary-foreground"><ShieldCheck /></div><div><p className="font-display text-lg font-bold">SecurePatrol</p><p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Agent access</p></div></div>
      {error ? <><h1 className="font-display text-2xl font-bold">Authorization unavailable</h1><p className="mt-3 text-sm text-muted-foreground">{error}</p></> : !details ? <p className="text-sm text-muted-foreground">Loading authorization request…</p> : <><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">External agent connection</p><h1 className="mt-3 font-display text-2xl font-bold">Connect {details.client?.name ?? "this agent"}?</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">This agent will be able to use SecurePatrol as your signed-in account and access the patrol data your account is allowed to see.</p><div className="mt-8 grid grid-cols-2 gap-3"><Button variant="outline" disabled={busy} onClick={() => void decide(false)}><X />Deny</Button><Button disabled={busy} onClick={() => void decide(true)}><Check />Approve</Button></div></>}
    </section>
  </main>;
}