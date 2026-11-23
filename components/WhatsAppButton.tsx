import { MessageCircle } from "lucide-react";

interface WhatsAppButtonProps {
  href: string;
  label?: string;
  size?: "sm" | "lg";
  className?: string;
}

export default function WhatsAppButton({
  href,
  label = "WhatsApp Enquiry",
  size = "sm",
  className = "",
}: WhatsAppButtonProps) {
  const sizing = size === "lg" ? "min-h-12 px-5 text-base" : "min-h-11 whitespace-nowrap px-2 text-sm";
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-whatsapp-dark font-medium text-white hover:bg-whatsapp-darker focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-whatsapp ${sizing} ${className}`}
    >
      <MessageCircle className={size === "lg" ? "h-5 w-5" : "h-4 w-4"} aria-hidden />
      {label}
    </a>
  );
}
