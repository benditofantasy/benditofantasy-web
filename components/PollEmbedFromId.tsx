import { getPollPayload } from "@/lib/content";
import PollEmbed from "./PollEmbed";
import PollUnavailable from "./PollUnavailable";

/**
 * Server-side resolver for the `<Poll id="..." />` MDX tag: looks up the
 * poll's payload by tile id from content on disk, then hands off to the
 * shared client component. Registered in the `components` map passed to
 * MDXRemote — the same map any future embeddable tool would register into.
 */
export default function PollEmbedFromId({ id }: { id: string }) {
  const payload = getPollPayload(id);
  if (!payload) return <PollUnavailable />;
  return <PollEmbed payload={payload} tileId={id} className="my-6" />;
}
