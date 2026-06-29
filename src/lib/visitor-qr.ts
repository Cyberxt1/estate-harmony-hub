import QRCode from "qrcode";
import type { Tables } from "@/integrations/supabase/types";

type Visitor = Tables<"visitors">;

export function getVisitorInvitePayload(visitor: Visitor) {
  return [
    `Estate visitor invite for ${visitor.full_name}`,
    `Gate code: ${visitor.qr_code || "Not available"}`,
    `Purpose: ${visitor.purpose || "Visitor entry"}`,
    `Expected time: ${formatDateTime(visitor.expected_at)}`,
  ].join("\n");
}

export async function getVisitorQrDataUrl(visitor: Visitor) {
  return QRCode.toDataURL(getVisitorInvitePayload(visitor), {
    margin: 1,
    width: 512,
    color: {
      dark: "#0f172a",
      light: "#ffffff",
    },
  });
}

export function formatDateTime(value?: string | null) {
  return value ? new Date(value).toLocaleString() : "Not provided";
}

export function normalizeWhatsAppPhone(value?: string | null) {
  if (!value) return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("+")) {
    return trimmed.slice(1).replace(/\D/g, "");
  }

  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("234")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `234${digits.slice(1)}`;
  return digits;
}

export function getVisitorWhatsAppLink(visitor: Visitor, hostName: string) {
  const phone = normalizeWhatsAppPhone(visitor.phone);
  if (!phone) return null;

  const text = [
    `Hello ${visitor.full_name},`,
    `${hostName} invited you to Oyesile Estate.`,
    "",
    `Gate code: ${visitor.qr_code || "Not available"}`,
    `Purpose: ${visitor.purpose || "Visitor entry"}`,
    `Expected time: ${formatDateTime(visitor.expected_at)}`,
    "",
    "Your QR code is attached in the app when this message opens.",
    "Please show the QR code or gate code at the entrance.",
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
