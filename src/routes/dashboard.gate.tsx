import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera, CheckCircle2, LogOut, ScanLine, Search, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/dashboard/gate")({
  component: GateCheckInPage,
});

type Visitor = Tables<"visitors">;
type Detector = {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};
type DetectorConstructor = new (options?: { formats?: string[] }) => Detector;

function GateCheckInPage() {
  const { user, profile, hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [entry, setEntry] = useState("");
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const gateman = hasRole("security_gateman");

  const stopCamera = () => {
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  useEffect(() => stopCamera, []);

  const lookup = useMutation({
    mutationFn: async (rawValue: string) => {
      if (!profile?.estate_id) throw new Error("Your account is not linked to the estate.");
      const code = extractGateCode(rawValue);
      if (!code) throw new Error("Enter or scan a valid gate code.");
      const { data, error } = await supabase
        .from("visitors")
        .select("*")
        .eq("estate_id", profile.estate_id)
        .ilike("qr_code", code)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("No visitor invite matches this code.");
      return data;
    },
    onSuccess: (data) => {
      stopCamera();
      setEntry(data.qr_code || "");
      setVisitor(data);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateStatus = useMutation({
    mutationFn: async (status: "checked_in" | "checked_out") => {
      if (!visitor || !user?.id) throw new Error("Find a visitor first.");
      const now = new Date().toISOString();
      const patch =
        status === "checked_in"
          ? { status, checked_in_at: now, checked_in_by: user.id }
          : { status, checked_out_at: now, checked_out_by: user.id };
      const { data, error } = await supabase
        .from("visitors")
        .update(patch)
        .eq("id", visitor.id)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      setVisitor(data);
      toast.success(data.status === "checked_in" ? "Visitor checked in" : "Visitor checked out");
      await queryClient.invalidateQueries({ queryKey: ["gate-visitors"] });
      await queryClient.invalidateQueries({ queryKey: ["visitors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const startCamera = async () => {
    const BarcodeDetector = (window as unknown as { BarcodeDetector?: DetectorConstructor })
      .BarcodeDetector;
    if (!BarcodeDetector) {
      toast.error(
        "QR camera scanning is not supported in this browser. Enter the gate code instead.",
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      setCameraActive(true);
      await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      if (!videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      const detector = new BarcodeDetector({ formats: ["qr_code"] });

      const scan = async () => {
        if (!videoRef.current || !streamRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes[0]?.rawValue) {
            lookup.mutate(codes[0].rawValue);
            return;
          }
        } catch {
          // Keep the camera open while the frame is not readable.
        }
        frameRef.current = requestAnimationFrame(scan);
      };
      frameRef.current = requestAnimationFrame(scan);
    } catch {
      stopCamera();
      toast.error("Camera access was not available. Enter the gate code instead.");
    }
  };

  if (!gateman) {
    return <AccessMessage />;
  }

  return (
    <div>
      <PageHeader
        title="Gate check-in"
        description="Scan a visitor QR code or enter the gate code."
        icon={ScanLine}
      />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={entry}
              onChange={(event) => setEntry(event.target.value.toUpperCase())}
              onKeyDown={(event) => {
                if (event.key === "Enter" && entry.trim()) lookup.mutate(entry);
              }}
              placeholder="Enter gate code"
              className="h-11 font-mono uppercase"
            />
            <Button
              className="h-11"
              onClick={() => lookup.mutate(entry)}
              loading={lookup.isPending}
              loadingLabel="Checking code"
              disabled={!entry.trim()}
            >
              <Search className="h-4 w-4" />
              Find visitor
            </Button>
          </div>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            OR
            <span className="h-px flex-1 bg-border" />
          </div>

          {cameraActive ? (
            <div className="space-y-3">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-black">
                <video ref={videoRef} className="h-full w-full object-cover" playsInline muted />
                <div className="pointer-events-none absolute inset-[18%] rounded-lg border-2 border-white/90" />
              </div>
              <Button variant="outline" className="w-full" onClick={stopCamera}>
                <Square className="h-4 w-4" />
                Stop camera
              </Button>
            </div>
          ) : (
            <Button variant="outline" className="h-24 w-full" onClick={() => void startCamera()}>
              <Camera className="h-5 w-5" />
              Scan visitor QR
            </Button>
          )}
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          {visitor ? (
            <div>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">Visitor</p>
                  <h2 className="mt-1 font-display text-xl font-semibold">{visitor.full_name}</h2>
                </div>
                <StatusBadge status={visitor.status} />
              </div>
              <dl className="mt-5 space-y-3 text-sm">
                <Detail label="Phone" value={visitor.phone} />
                <Detail label="Purpose" value={visitor.purpose} />
                <Detail
                  label="Expected"
                  value={
                    visitor.expected_at ? new Date(visitor.expected_at).toLocaleString() : null
                  }
                />
                <Detail label="Gate code" value={visitor.qr_code} />
              </dl>
              <div className="mt-5">
                {visitor.status === "expected" && (
                  <Button
                    className="h-11 w-full"
                    onClick={() => updateStatus.mutate("checked_in")}
                    loading={updateStatus.isPending}
                    loadingLabel="Checking visitor in"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Check in visitor
                  </Button>
                )}
                {visitor.status === "checked_in" && (
                  <Button
                    className="h-11 w-full"
                    onClick={() => updateStatus.mutate("checked_out")}
                    loading={updateStatus.isPending}
                    loadingLabel="Checking visitor out"
                  >
                    <LogOut className="h-4 w-4" />
                    Check out visitor
                  </Button>
                )}
                {visitor.status === "checked_out" && (
                  <p className="rounded-lg bg-muted p-3 text-center text-sm text-muted-foreground">
                    This visitor has already left the estate.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="grid min-h-72 place-items-center text-center">
              <div>
                <ScanLine className="mx-auto h-8 w-8 text-muted-foreground" />
                <h2 className="mt-3 font-display text-lg font-semibold">No visitor selected</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  A matching visitor record will appear here.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function extractGateCode(value: string) {
  const payloadMatch = value.match(/Gate code:\s*([a-z0-9]+)/i);
  return (payloadMatch?.[1] || value.trim()).replace(/\s/g, "").toUpperCase();
}

function Detail({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border pb-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="max-w-[65%] text-right font-medium">{value || "Not provided"}</dd>
    </div>
  );
}

function StatusBadge({ status }: { status: Visitor["status"] }) {
  return (
    <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium capitalize text-accent-foreground">
      {status.replace("_", " ")}
    </span>
  );
}

function AccessMessage() {
  return (
    <div className="grid min-h-[28vh] place-items-center text-center">
      <div className="rounded-lg border border-border bg-card p-5">
        <h1 className="font-display text-lg font-semibold">Gateman access only</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page is reserved for the estate gate team.
        </p>
      </div>
    </div>
  );
}
