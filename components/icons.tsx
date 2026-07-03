import type { JSX } from "react";
import type { TileType } from "@/lib/types";

interface IconProps {
  className?: string;
}

/* Minimal 16px stroke icons for pill badges and chrome. Decorative by default. */

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="currentColor">
      <path d="M4.5 2.8v10.4c0 .6.66.97 1.17.65l8.16-5.2a.77.77 0 0 0 0-1.3L5.67 2.15a.77.77 0 0 0-1.17.65Z" />
    </svg>
  );
}

export function MicIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="6" y="1.5" width="4" height="8" rx="2" />
      <path d="M3.5 7.5a4.5 4.5 0 0 0 9 0M8 12v2.5" />
    </svg>
  );
}

export function TableIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <path d="M2 6.5h12M6.5 6.5V13" />
    </svg>
  );
}

export function ChartIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 13V9M8 13V4M13 13V6.5" />
    </svg>
  );
}

export function ImageIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="3" width="12" height="10" rx="1" />
      <circle cx="5.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      <path d="m3.5 12 3.5-3.5 2 2 2.5-2.5 1 1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function QuoteIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="currentColor">
      <path d="M3 9.5C3 6.5 4.8 4.4 7 3.5l.6 1.2c-1.4.7-2.2 1.8-2.3 3 .2-.1.5-.2.8-.2 1.1 0 1.9.8 1.9 2A2 2 0 0 1 6 11.6c-1.7 0-3-1-3-2.1Zm6.4 0c0-3 1.8-5.1 4-6l.6 1.2c-1.4.7-2.2 1.8-2.3 3 .2-.1.5-.2.8-.2 1.1 0 1.9.8 1.9 2a2 2 0 0 1-2 2.1c-1.7 0-3-1-3-2.1Z" />
    </svg>
  );
}

export function XSocialIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="currentColor">
      <path d="M9.3 6.9 14.6 1h-1.3L8.8 6.1 5.2 1H1l5.6 7.9L1 15h1.3l4.9-5.4L11 15h4.2L9.3 6.9Zm-1.7 1.9-.6-.8L2.7 2h1.9l3.7 5.1.6.8 4.7 6.6h-1.9L7.6 8.8Z" />
    </svg>
  );
}

export function ArticleIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 3.5h10M3 6.5h10M3 9.5h10M3 12.5h6" />
    </svg>
  );
}

export function WhatsAppIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="currentColor">
      <path d="M8 1.3A6.6 6.6 0 0 0 2.3 11L1.4 14l3.1-.8A6.6 6.6 0 1 0 8 1.3Zm0 12a5.4 5.4 0 0 1-2.8-.8l-.2-.1-1.9.5.5-1.8-.1-.2A5.4 5.4 0 1 1 8 13.3Zm3-4c-.2-.1-1-.5-1.1-.5-.2-.1-.3-.1-.4.1l-.5.6c-.1.1-.2.1-.4 0a4.4 4.4 0 0 1-2.2-1.9c-.2-.3 0-.4.1-.5l.3-.4c.1-.1.1-.2 0-.4L6.2 4.9c-.1-.3-.3-.3-.4-.3h-.4c-.1 0-.3 0-.5.3-.2.2-.6.6-.6 1.5s.7 1.8.8 1.9c.1.1 1.3 2 3.1 2.8 1.5.6 1.8.5 2.1.5.3 0 1-.4 1.2-.8.1-.4.1-.8.1-.8l-.6-.4Z" />
    </svg>
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M6.5 9.5a3 3 0 0 0 4.2.3l2-2a3 3 0 1 0-4.2-4.2l-1 1" />
      <path d="M9.5 6.5a3 3 0 0 0-4.2-.3l-2 2a3 3 0 1 0 4.2 4.2l1-1" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="7" cy="7" r="4.5" />
      <path d="m10.5 10.5 3 3" />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 5h10M3 8h10M3 11h10" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 3 5 8l5 5" />
    </svg>
  );
}

export function ChevronRightIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 3 5 5-5 5" />
    </svg>
  );
}

const TYPE_ICONS: Record<TileType, (props: IconProps) => JSX.Element> = {
  podcast: MicIcon,
  video: PlayIcon,
  article: ArticleIcon,
  data: TableIcon,
  chart: ChartIcon,
  tweet: XSocialIcon,
  image: ImageIcon,
  quote: QuoteIcon,
};

export function TypeIcon({ type, className }: IconProps & { type: TileType }) {
  const Icon = TYPE_ICONS[type];
  return <Icon className={className} />;
}
