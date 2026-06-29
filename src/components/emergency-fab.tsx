import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Ambulance, PhoneCall, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function EmergencyFab() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");

  const { data: contacts = [] } = useQuery({
    queryKey: ["emergency-contacts", profile?.estate_id],
    enabled: Boolean(profile?.estate_id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .order("priority", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const reportEmergency = useMutation({
    mutationFn: async () => {
      if (!user || !profile?.estate_id) throw new Error("Sign in to report an emergency.");
      if (!type.trim()) throw new Error("Enter the kind of emergency.");
      const { error } = await supabase.from("security_incidents").insert({
        estate_id: profile.estate_id,
        reporter_id: user.id,
        type: type.trim(),
        severity: "critical",
        location: location.trim() || null,
        description: description.trim() || null,
        occurred_at: new Date().toISOString(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Emergency reported");
      setOpen(false);
      setType("");
      setLocation("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey: ["incidents"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const primarySecurity = contacts.find((item) => item.label.toLowerCase().includes("security"));
  const primaryHospital = contacts.find((item) => item.label.toLowerCase().includes("hospital"));

  return (
    <>
      <div className="fixed bottom-5 right-5 z-40">
        <Popover>
          <PopoverTrigger asChild>
            <Button className="h-12 rounded-full px-4 shadow-lg">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Emergency
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-semibold">Emergency help</h3>
                <p className="text-xs text-muted-foreground">
                  Quick actions for security, hospital help, or incident reports.
                </p>
              </div>
              {primarySecurity && (
                <QuickAction
                  href={`tel:${primarySecurity.phone}`}
                  icon={PhoneCall}
                  title={primarySecurity.label}
                  subtitle={primarySecurity.phone}
                />
              )}
              {primaryHospital && (
                <QuickAction
                  href={`tel:${primaryHospital.phone}`}
                  icon={Ambulance}
                  title={primaryHospital.label}
                  subtitle={primaryHospital.phone}
                />
              )}
              <Button className="w-full" variant="outline" onClick={() => setOpen(true)}>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Report an emergency
              </Button>
              <Button asChild className="w-full" variant="ghost">
                <Link to="/dashboard/visitors">Open visitor and gate log</Link>
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report emergency</DialogTitle>
            <DialogDescription>
              This sends a critical incident report to the security workspace immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Emergency type</Label>
              <Input
                value={type}
                onChange={(event) => setType(event.target.value)}
                placeholder="Medical, fire, break-in..."
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={(event) => setLocation(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Details</Label>
              <Textarea
                rows={4}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => reportEmergency.mutate()}
              loading={reportEmergency.isPending}
              loadingLabel="Reporting emergency"
            >
              Send emergency report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  subtitle,
}: {
  href: string;
  icon: typeof PhoneCall;
  title: string;
  subtitle: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 rounded-lg border border-border px-3 py-2 transition hover:bg-secondary/30"
    >
      <div className="grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </a>
  );
}
