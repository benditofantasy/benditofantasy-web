import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Bendito Fantasy — FPL en español";
export const size = { width: 752, height: 750 };
export const contentType = "image/jpeg";

/**
 * Default Open Graph card (SPEC §16). Serves the owner's pre-designed social
 * share graphic (public/brand/social-share.jpg — the canonical copy, reused
 * from here rather than duplicated) as-is; no Satori compositing needed
 * since the image already has the logo/tagline/photo baked in.
 */
export default async function OpengraphImage() {
  const imageBuffer = await fetch(
    new URL("../public/brand/social-share.jpg", import.meta.url),
  ).then((res) => res.arrayBuffer());
  const imageSrc = `data:image/jpeg;base64,${Buffer.from(imageBuffer).toString("base64")}`;

  return new ImageResponse(
    (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageSrc}
        width={size.width}
        height={size.height}
        alt=""
        style={{ objectFit: "cover" }}
      />
    ),
    size,
  );
}
