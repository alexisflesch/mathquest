import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";
import { interpolate } from "flubber";

const DURATION = 1.5; // seconds per morph

// SVG path definitions (simplified placeholders, will need refinement)
const paths = {
    infinity:
        "M10,20 C0,0 40,0 30,20 C40,40 0,40 10,20 Z", // 8-like
    three:
        "M10,5 C30,0 30,20 10,20 C30,20 30,40 10,35 Z", // rough 3
    two:
        "M10,5 C30,0 30,20 10,25 C10,35 30,35 30,35 Z", // rough 2
    one:
        "M15,5 L15,40 L12,37", // French-style 1
};

const CountdownMorph = () => {
    const [step, setStep] = useState(0);
    const [path, setPath] = useState(paths.infinity);
    const controls = useAnimation();

    useEffect(() => {
        const sequences = ["infinity", "three", "two", "one"];
        if (step >= sequences.length - 1) return;

        const from = paths[sequences[step]];
        const to = paths[sequences[step + 1]];
        const interpolator = interpolate(from, to, { maxSegmentLength: 0.5 });

        let frame = 0;
        const totalFrames = 60 * DURATION;

        const animate = () => {
            const t = frame / totalFrames;
            setPath(interpolator(t));
            frame++;
            if (frame <= totalFrames) requestAnimationFrame(animate);
            else setStep((s) => s + 1);
        };

        animate();
    }, [step]);

    return (
        <div className="flex items-center justify-center h-screen bg-black">
            <svg
                width="200"
                height="200"
                viewBox="0 0 40 45"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <motion.path
                    d={path}
                    fill="none"
                    stroke="#00FFAA"
                    strokeWidth="2"
                />
                {/* Dot moving around (simplified) */}
                <motion.circle
                    cx="10"
                    cy="20"
                    r="1.2"
                    fill="#00FFAA"
                    animate={{
                        cx: [10, 30, 10],
                        cy: [20, 20, 20],
                    }}
                    transition={{
                        duration: DURATION,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                />
            </svg>
        </div>
    );
};

export default CountdownMorph;
