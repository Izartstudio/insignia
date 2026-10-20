"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { introductionConfig, introductionSlides } from "@/config/introduction";
import { SunGraphic } from "./SunGraphic";

export function InsigniaIntroduction() {
  const sectionRef = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();
    const context = gsap.context(() => {
      media.add(
        { motion: "(prefers-reduced-motion: no-preference)", reduced: "(prefers-reduced-motion: reduce)" },
        (match) => {
          if (match.conditions?.reduced) {
            section.classList.add("introduction--reduced");
            return () => section.classList.remove("introduction--reduced");
          }

          const numbers = gsap.utils.toArray<HTMLElement>(".introduction-number", section);
          const paragraphs = gsap.utils.toArray<HTMLElement>(".introduction-copy", section);
          const numberEntrances = gsap.utils.toArray<HTMLElement>(".introduction-number > span", section);
          const copyEntrances = gsap.utils.toArray<HTMLElement>(".introduction-copy > span", section);
          const core = section.querySelector<HTMLElement>(".sun-core");
          const stageOneRays = gsap.utils.toArray<HTMLElement>('[data-ray-stage="1"]', section);
          const stageTwoRays = gsap.utils.toArray<HTMLElement>('[data-ray-stage="2"]', section);
          const stageThreeRays = gsap.utils.toArray<HTMLElement>('[data-ray-stage="3"]', section);
          const divider = section.querySelector<HTMLElement>(".introduction-divider");
          const sun = section.querySelector<HTMLElement>(".introduction-sun");
          if (!core || !divider || !sun || numbers.length !== 3 || paragraphs.length !== 3) return;

          gsap.set([numbers[0], paragraphs[0]], { autoAlpha: 1, y: 0 });
          gsap.set(numbers.slice(1), { autoAlpha: 0, y: 15 });
          gsap.set(paragraphs.slice(1), { autoAlpha: 0, y: 15 });
          gsap.set(stageTwoRays.concat(stageThreeRays), { autoAlpha: 0, scaleX: 0.45 });
          gsap.set(core, { opacity: 0.55, scale: 0.88 });

          const entrance = gsap.timeline({ paused: true, defaults: { ease: "power3.out" } })
            .from(numberEntrances, { autoAlpha: 0, y: 15, duration: 0.8 }, 0)
            .from(divider, { scaleX: 0, duration: 0.9 }, 0.15)
            .from(sun, { autoAlpha: 0, scale: 0.85, duration: 1 }, 0.35)
            .from(stageOneRays, { autoAlpha: 0, scaleX: 0.5, duration: 0.7, stagger: 0.045 }, 0.5)
            .from(copyEntrances, { autoAlpha: 0, y: 20, duration: 0.9 }, 0.65);
          let entranceStarted = false;
          const revealEntrance = () => {
            if (entranceStarted) return;
            entranceStarted = true;
            entrance.play(0);
          };

          const transition = (timeline: gsap.core.Timeline, from: number, to: number, start: number, end: number, raysToReveal: HTMLElement[], coreOpacity: number, coreScale: number) => {
            const duration = end - start;
            timeline
              .fromTo([numbers[from], paragraphs[from]], { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -15, immediateRender: false, duration: duration * 0.45 }, start)
              .fromTo([numbers[to], paragraphs[to]], { autoAlpha: 0, y: 15 }, { autoAlpha: 1, y: 0, immediateRender: false, duration: duration * 0.55 }, start + duration * 0.45)
              .to(raysToReveal, { autoAlpha: 1, scaleX: 1, duration, stagger: duration / Math.max(raysToReveal.length, 1) * 0.25 }, start)
              .to(core, { opacity: coreOpacity, scale: coreScale, duration }, start);
          };

          const master = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
          // Measure upstream pins first, regardless of asynchronous mount order.
          refreshPriority: 30,
              trigger: section,
              start: "top top",
              end: () => `+=${section.clientHeight * (window.innerWidth >= 1025 ? 1.9 : introductionConfig.scrollDistanceInViewports)}`,
              scrub: introductionConfig.scrub,
              pin: true,
              pinSpacing: false,
              anticipatePin: 1,
              invalidateOnRefresh: true,
              onEnter: revealEntrance,
              onEnterBack: revealEntrance,
            },
          });
          transition(master, 0, 1, introductionConfig.firstTransition.start, introductionConfig.firstTransition.end, stageTwoRays, 0.72, 0.95);
          transition(master, 1, 2, introductionConfig.secondTransition.start, introductionConfig.secondTransition.end, stageThreeRays, 0.9, 1);
          master.to({}, { duration: 1 - introductionConfig.secondTransition.end }, introductionConfig.secondTransition.end);

          return () => entrance.kill();

        },
      );
    }, section);

    return () => {
      media.revert();
      context.revert();
    };
  }, []);

  return (
    <div className="introduction-track">
    <section ref={sectionRef} className="introduction" aria-labelledby="introduction-title">
      <h2 id="introduction-title" className="sr-only">About Insignia</h2>
      <ol className="sr-only introduction-accessible-list">
        {introductionSlides.map((slide) => <li key={slide.number}>{slide.text}</li>)}
      </ol>
      <div className="introduction-composition" aria-hidden="true">
        {introductionSlides.map((slide) => (
          <div className="introduction-slide" key={slide.number}>
            <span className="introduction-number"><span style={{ display: "block" }}>{slide.number.split("").join(" ")}</span></span>
            <p className="introduction-copy"><span style={{ display: "block" }}>{slide.text}</span></p>
          </div>
        ))}
        <span className="introduction-divider" />
        <SunGraphic />
      </div>
      <ol className="introduction-reduced-list">
        {introductionSlides.map((slide) => <li key={slide.number}><span>{slide.number}</span><p>{slide.text}</p></li>)}
      </ol>
    </section>
    </div>
  );
}
