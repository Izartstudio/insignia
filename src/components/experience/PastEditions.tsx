import { InfiniteDraggableMarquee } from "@/components/ui/InfiniteDraggableMarquee";
import { bottomRowItems, topRowItems } from "@/content/past-editions";
import { EditionMarqueeItem } from "./EditionMarqueeItem";

export function PastEditions({ id = "past-editions", continuation = false, hasContinuation = false }: { id?: string; continuation?: boolean; hasContinuation?: boolean }) {
  const topItems = topRowItems.map((item) => <EditionMarqueeItem item={item} key={item.id} />);
  const bottomItems = bottomRowItems.map((item) => <EditionMarqueeItem item={item} key={item.id} />);
  return (
    <section id={id} className={`past-editions${continuation ? " past-editions--continuation" : ""}${hasContinuation ? " past-editions--has-continuation" : ""}`} aria-labelledby={continuation ? undefined : `${id}-title`} aria-label={continuation ? "More past editions" : undefined}>
      {!continuation && <header className="past-editions-heading">
        <p>PAST EDITIONS</p>
        <h2 id={`${id}-title`}>Every Edition Explores A Defining<br className="past-editions-desktop-break" /> Question For The Indian Industry</h2>
      </header>}
      <div className="past-editions-divider" aria-hidden="true"><span /></div>
      <div className="past-editions-gallery">
        <InfiniteDraggableMarquee items={topItems} direction="right" speed={35} gap={20} draggable ariaLabel="Past editions, top row" />
        <InfiniteDraggableMarquee items={bottomItems} direction="left" speed={35} gap={20} draggable ariaLabel="Past editions, bottom row" />
      </div>
    </section>
  );
}
