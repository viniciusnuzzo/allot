"use client";

import React, { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";

type ContainerScrollProps = {
  titleComponent: string | React.ReactNode;
  children: React.ReactNode;
};

export function ContainerScroll({ titleComponent, children }: ContainerScrollProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const [isMobile, setIsMobile] = React.useState(false);
  const shouldReduceMotion = useReducedMotion();

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const rotate = useTransform(scrollYProgress, [0, 1], [20, 0]);
  const scale = useTransform(scrollYProgress, [0, 1], isMobile ? [0.7, 0.9] : [1.05, 1]);
  const translate = useTransform(scrollYProgress, [0, 1], [0, -100]);

  return (
    <div ref={containerRef} className="relative flex h-[48rem] items-center justify-center px-2 md:h-[66rem] md:px-20">
      <div className="relative w-full py-10 md:py-40" style={{ perspective: "1000px" }}>
        <Header translate={translate} titleComponent={titleComponent} reducedMotion={Boolean(shouldReduceMotion)} />
        <Card rotate={rotate} scale={scale} reducedMotion={Boolean(shouldReduceMotion)}>
          {children}
        </Card>
      </div>
    </div>
  );
}

export function Header({
  translate,
  titleComponent,
  reducedMotion,
}: {
  translate: MotionValue<number>;
  titleComponent: string | React.ReactNode;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      style={{ translateY: reducedMotion ? 0 : translate }}
      className="mx-auto max-w-5xl text-center"
    >
      {titleComponent}
    </motion.div>
  );
}

export function Card({
  rotate,
  scale,
  reducedMotion,
  children,
}: {
  rotate: MotionValue<number>;
  scale: MotionValue<number>;
  reducedMotion: boolean;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      style={{
        rotateX: reducedMotion ? 0 : rotate,
        scale: reducedMotion ? 1 : scale,
        boxShadow: "0 18px 40px rgba(32,33,31,.19), 0 60px 90px rgba(32,33,31,.12)",
      }}
      className="mx-auto -mt-4 h-[26rem] w-full max-w-5xl rounded-[30px] bg-[#20211f] p-2 md:-mt-12 md:h-[38rem] md:p-6"
    >
      <div className="h-full w-full overflow-hidden rounded-[22px] bg-[#fffef8]">
        {children}
      </div>
    </motion.div>
  );
}
