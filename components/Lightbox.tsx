"use client";

import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, type JSX } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLang } from "@/lib/i18n";
import { getSlides, type Row, type Slide } from "@/lib/types";
import ChartSlide from "./slides/ChartSlide";
import CoverSlide from "./slides/CoverSlide";
import DataSlide from "./slides/DataSlide";
import MediaSlide from "./slides/MediaSlide";
import MvpSlide from "./slides/MvpSlide";
import QuoteSlide from "./slides/QuoteSlide";
import SocialSlide from "./slides/SocialSlide";
import TweetSlide from "./slides/TweetSlide";
import VideoSlide from "./slides/VideoSlide";
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon } from "./icons";

export interface SlideProps {
  tile: Slide["tile"];
  gameweek: Row;
  /** true when this slide's media shares its layoutId with the grid tile
   *  (the "explode" travel) — only the tile the lightbox was opened from. */
  shared: boolean;
}

const SLIDE_RENDERERS: Record<Slide["layout"], (props: SlideProps) => JSX.Element> = {
  cover: CoverSlide,
  media: MediaSlide,
  video: VideoSlide,
  data: DataSlide,
  chart: ChartSlide,
  quote: QuoteSlide,
  tweet: TweetSlide,
  social: SocialSlide,
  mvp: MvpSlide,
};

const SWIPE_THRESHOLD = 60;
const WHEEL_THRESHOLD = 24;
/** cooldown after a wheel-triggered nav so one scroll gesture doesn't fire it repeatedly */
const WHEEL_LOCK_MS = 500;

/**
 * The exploded lightbox (SPEC §9–§10): a history-based overlay over `/`
 * (`/?item=<id>`). Opening is a shared-element "explode": the clicked tile's
 * cover travels into the slide's media position (framer-motion layoutId)
 * while the typography staggers in from the left. ←/→ steps across the
 * flattened slides of the current gameweek only; on the last slide, → closes
 * and returns to the gameweek row. Mobile: swipe + edge tap zones (SPEC §12).
 */
export default function Lightbox({
  gameweeks,
  seasons = [],
}: {
  gameweeks: Row[];
  seasons?: Row[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const itemId = searchParams.get("item");
  const { t, l } = useLang();

  const dialogRef = useRef<HTMLDivElement>(null);
  /** true once the lightbox was opened by in-app navigation (Back closes it). */
  const openedInAppRef = useRef(false);
  /** tile to restore focus to after close (SPEC §10). */
  const returnFocusIdRef = useRef<string | null>(null);
  const wasOpenRef = useRef(false);
  const touchStartX = useRef<number | null>(null);
  const wheelLockedRef = useRef(false);

  const lookup = useMemo(() => {
    const map = new Map<
      string,
      { gameweek: Row; slides: Slide[]; index: number }
    >();
    // Live gameweeks: ←/→ traverses the whole week (unchanged, SPEC §10).
    for (const gameweek of gameweeks) {
      const slides = gameweek.tiles.flatMap(getSlides);
      slides.forEach((slide, index) => {
        map.set(slide.tile.id, { gameweek, slides, index });
      });
    }
    // Rolled-up seasons: ←/→ flows through the whole year — each mvp tile's
    // nested slides, then straight into the next gameweek's mvp tile — and
    // only closes at the season's last slide (owner-confirmed: scrolling a
    // season should read start-to-end like a year in review, not stop at
    // each gameweek boundary the way a live gameweek row does).
    for (const season of seasons) {
      const slides = season.tiles.flatMap(getSlides);
      slides.forEach((slide, index) => {
        map.set(slide.tile.id, { gameweek: season, slides, index });
      });
    }
    return map;
  }, [gameweeks, seasons]);

  const current = itemId ? (lookup.get(itemId) ?? null) : null;

  /**
   * Read the position from the live URL, not React state — rapid ←/→ presses
   * would otherwise navigate from a stale index and get swallowed.
   */
  const liveCurrent = useCallback(() => {
    const id = new URLSearchParams(window.location.search).get("item");
    return id ? (lookup.get(id) ?? null) : null;
  }, [lookup]);

  // Track open/close transitions: remember the originating tile, restore focus
  // to it on close (SPEC §10 — also scrolls its gameweek row into view).
  useEffect(() => {
    if (current && !wasOpenRef.current) {
      wasOpenRef.current = true;
      returnFocusIdRef.current = current.slides[current.index].tile.id;
    }
    if (!current && wasOpenRef.current) {
      wasOpenRef.current = false;
      const id = returnFocusIdRef.current;
      if (id) {
        const tileEl = document.getElementById(`tile-${id}`);
        tileEl?.scrollIntoView({ block: "center" });
        tileEl?.focus({ preventScroll: true });
      }
    }
  }, [current]);

  // Any render without ?item means we were on the homepage in-app, so a later
  // open pushed a history entry and Back/router.back() will close it. If the
  // first load already had ?item (a deep link), this stays false and closing
  // pushes "/" instead of leaving the site.
  useEffect(() => {
    if (!itemId) openedInAppRef.current = true;
  }, [itemId]);

  const close = useCallback(() => {
    if (openedInAppRef.current) router.back();
    else router.push("/", { scroll: false });
  }, [router]);

  const goTo = useCallback(
    (id: string) => {
      router.replace(`/?item=${id}`, { scroll: false });
    },
    [router],
  );

  const goPrev = useCallback(() => {
    const live = liveCurrent();
    if (!live || live.index === 0) return;
    goTo(live.slides[live.index - 1].tile.id);
  }, [liveCurrent, goTo]);

  /** → on the last item closes and returns to the row (SPEC §10). */
  const goNext = useCallback(() => {
    const live = liveCurrent();
    if (!live) return;
    if (live.index >= live.slides.length - 1) {
      close();
      return;
    }
    goTo(live.slides[live.index + 1].tile.id);
  }, [liveCurrent, close, goTo]);

  // Keyboard: ←/→ within the gameweek, Esc closes; focus trap (SPEC §10/§15).
  // The listener is attached permanently (not gated on the lightbox being
  // open) and checks the live URL per event: React can starve the dialog's
  // own effects for over a second under rapid keyboard input, and a
  // current-gated listener would let early Tab presses walk the background.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!liveCurrent()) return; // lightbox not open
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      } else if (event.key === "ArrowRight") {
        goNext();
      } else if (event.key === "ArrowLeft") {
        goPrev();
      } else if (event.key === "Tab") {
        const dialog = dialogRef.current;
        if (!dialog || !dialog.isConnected) {
          // open per the URL but the dialog hasn't committed yet — swallow
          // the Tab so focus can't wander the background mid-open
          event.preventDefault();
          return;
        }
        const focusables = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), iframe, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => el.offsetParent !== null);
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        // focus escaped (or never entered) — pull it inside
        if (!dialog.contains(active)) {
          event.preventDefault();
          first.focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [liveCurrent, close, goNext, goPrev]);

  // Scroll lock + initial focus while open.
  useEffect(() => {
    if (!current) return;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();
    return () => {
      document.body.style.overflow = "";
    };
  }, [current]);

  const pad = (n: number) => String(n).padStart(2, "0");

  let content: JSX.Element | null = null;
  if (current) {
    const { gameweek, slides, index } = current;
    const slide = slides[index];
    const prevSlide = index > 0 ? slides[index - 1] : null;
    const nextSlide = index < slides.length - 1 ? slides[index + 1] : null;
    const Renderer = SLIDE_RENDERERS[slide.layout];
    // Only the originating tile does the shared-element travel; slides reached
    // via ←/→ enter with the staggered slide-in instead. On the opening render
    // the ref isn't set yet (effects run after paint), so "not open yet" means
    // this IS the originating tile.
    const shared = !wasOpenRef.current || slide.tile.id === returnFocusIdRef.current;

    content = (
      <motion.div
        key="lightbox"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={l(slide.tile.title)}
        tabIndex={-1}
        className="fixed inset-0 z-50 bg-surface"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(event) => {
          // backdrop click closes: any slide-root whitespace (marked
          // data-backdrop by each slide layout) or the overlay itself
          const target = event.target as HTMLElement;
          if (target === event.currentTarget || target.dataset.backdrop) close();
        }}
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0].clientX;
        }}
        onTouchEnd={(event) => {
          // swipe navigation on touch (SPEC §12 mobile)
          const startX = touchStartX.current;
          touchStartX.current = null;
          if (startX === null) return;
          const delta = event.changedTouches[0].clientX - startX;
          if (delta <= -SWIPE_THRESHOLD) goNext();
          else if (delta >= SWIPE_THRESHOLD) goPrev();
        }}
        onWheel={(event) => {
          // scroll-wheel/trackpad navigation, same mapping as swipe: down/right
          // advances, up/left goes back. Locked briefly after firing so one
          // scroll gesture (which fires dozens of wheel events) doesn't page
          // through several slides at once.
          if (wheelLockedRef.current) return;
          const delta =
            Math.abs(event.deltaY) > Math.abs(event.deltaX)
              ? event.deltaY
              : event.deltaX;
          if (Math.abs(delta) < WHEEL_THRESHOLD) return;
          wheelLockedRef.current = true;
          if (delta > 0) goNext();
          else goPrev();
          window.setTimeout(() => {
            wheelLockedRef.current = false;
          }, WHEEL_LOCK_MS);
        }}
      >
        {/* slide content — keyed so entrance animations replay per slide */}
        <div className="h-full overflow-y-auto" data-backdrop="true">
          <Renderer
            key={slide.tile.id}
            tile={slide.tile}
            gameweek={gameweek}
            shared={shared}
          />
        </div>

        {/* mobile tap zones replace the hover arrows (SPEC §12) */}
        {index > 0 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label={t("previous")}
            className="absolute bottom-24 left-0 top-24 z-[5] w-1/5 sm:hidden"
          />
        )}
        <button
          type="button"
          onClick={goNext}
          aria-label={nextSlide ? t("next") : t("backHome")}
          className="absolute bottom-24 right-0 top-24 z-[5] w-1/5 sm:hidden"
        />

        {/* prev/next slivers bleeding in at the edges (§7A) */}
        {prevSlide && (
          <button
            type="button"
            onClick={goPrev}
            aria-label={t("previous")}
            className="absolute bottom-0 left-0 top-0 hidden w-2.5 overflow-hidden opacity-70 transition-opacity duration-fast hover:opacity-100 sm:block"
          >
            <Image src={prevSlide.tile.cover} alt="" fill sizes="12px" className="object-cover" />
          </button>
        )}
        {nextSlide && (
          <button
            type="button"
            onClick={goNext}
            aria-label={t("next")}
            className="absolute bottom-0 right-0 top-0 hidden w-2.5 overflow-hidden opacity-70 transition-opacity duration-fast hover:opacity-100 sm:block"
          >
            <Image src={nextSlide.tile.cover} alt="" fill sizes="12px" className="object-cover" />
          </button>
        )}

        {/* chrome: outlined circular ✕ top-left */}
        <button
          type="button"
          onClick={close}
          aria-label={t("close")}
          className="absolute left-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-pill border border-line bg-surface/80 text-ink backdrop-blur-sm transition-colors duration-fast hover:border-ink sm:left-6 sm:top-6"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* pagination: bold condensed numerals, em dash (§7A) */}
        <p className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2 font-display text-xl tracking-display text-ink">
          {pad(index + 1)}
          <span className="mx-2 text-ink-soft">—</span>
          {pad(slides.length)}
        </p>

        {/* red circular arrows (desktop/tablet); ← hidden on first item (§10) */}
        {index > 0 && (
          <button
            type="button"
            onClick={goPrev}
            aria-label={t("previous")}
            className="absolute bottom-6 left-8 z-10 hidden h-14 w-14 items-center justify-center rounded-pill bg-accent text-accent-ink shadow-lifted transition-transform duration-fast motion-safe:hover:scale-105 sm:inline-flex lg:h-16 lg:w-16"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          aria-label={nextSlide ? t("next") : t("backHome")}
          className="absolute bottom-6 right-8 z-10 hidden h-14 w-14 items-center justify-center rounded-pill bg-accent text-accent-ink shadow-lifted transition-transform duration-fast motion-safe:hover:scale-105 sm:inline-flex lg:h-16 lg:w-16"
        >
          <ChevronRightIcon className="h-6 w-6" />
        </button>
      </motion.div>
    );
  }

  return <AnimatePresence>{content}</AnimatePresence>;
}
