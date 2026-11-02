"use client";

import Image from "next/image";
import { useState } from "react";
import diceSVG from "@/assets/icon-dice.svg";
import dividerDesktopSVG from "@/assets/pattern-divider-desktop.svg";
import dividerMobileSVG from "@/assets/pattern-divider-mobile.svg";
import { getAdvice, type Slip } from "@/lib/getAdvice";

type Props = Slip;

export default function AdviceGenerator({ advice, id }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [slip, setSlip] = useState<Slip>({ advice, id });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const fetchAdviceOnClick = async () => {
    setIsLoading(true);
    setError(null);

    try {
      setSlip(await getAdvice());
    } catch {
      setError(
        navigator.onLine
          ? "Couldn't get new advice. Try again."
          : "You're offline. Reconnect and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="bg-dark-grayish-blue desktop:rounded-[15px] desktop:max-w-135 desktop:px-12 relative inline-flex w-full max-w-85.75 flex-col items-center rounded-[10px] px-6 shadow-[30px_50px_80px_0_rgba(0,0,0,0.10)]">
      <h1 className="text-neon-green no-ligatures desktop:mt-12 desktop:text-[13px] desktop:tracking-[3.73px] font-manrope mt-10 mb-6 text-center text-[11px] leading-[normal] font-extrabold tracking-[3.22px] uppercase not-italic">
        Advice {`#${slip.id}`}
      </h1>
      <p className="text-light-cyan desktop:mb-10 desktop:text-[28px] desktop:tracking-[-0.3px] font-manrope mb-6 text-center text-[24px] leading-[normal] font-extrabold tracking-[-0.257px] not-italic">
        {slip.advice}
      </p>
      <picture>
        <source
          height={dividerDesktopSVG.height}
          media="(min-width: 1440px)"
          srcSet={dividerDesktopSVG.src}
          width={dividerDesktopSVG.width}
        />
        <img
          alt=""
          height={dividerMobileSVG.height}
          src={dividerMobileSVG.src}
          width={dividerMobileSVG.width}
        />
      </picture>
      <p
        className="text-light-cyan no-ligatures desktop:text-[13px] desktop:tracking-[3.73px] font-manrope desktop:mb-18 desktop:not-empty:mt-10 mb-16 text-center text-[11px] leading-[normal] font-extrabold tracking-[3.22px] uppercase not-italic not-empty:mt-6"
        role="status"
      >
        {error}
      </p>
      <button
        aria-label="generate new advice"
        className="bg-neon-green absolute right-1/2 bottom-0 flex size-16 translate-1/2 cursor-pointer items-center justify-center rounded-full hover:shadow-[0_0_40px_0_#53ffaa] disabled:cursor-wait disabled:opacity-60"
        disabled={isLoading}
        onClick={fetchAdviceOnClick}
        type="button"
      >
        <Image alt="" loading="eager" src={diceSVG} />
      </button>
    </section>
  );
}
