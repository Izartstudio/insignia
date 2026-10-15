import Image from "next/image";
import type { EditionMarqueeItem as EditionMarqueeItemData } from "@/content/past-editions";

export function EditionMarqueeItem({ item }: { item: EditionMarqueeItemData }) {
  if (item.type === "edition") {
    return <div className="edition-label"><span>{item.year}</span><p>{item.title}</p></div>;
  }
  return (
    <div className="edition-image">
      <Image src={item.src} alt={item.alt} fill sizes="(max-width: 767px) 180px, (min-width: 1920px) 360px, 19vw" draggable={false} />
    </div>
  );
}
