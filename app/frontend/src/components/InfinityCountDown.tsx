import React, { useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import * as flubber from 'flubber';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

/* ========== Réglages ========== */
const SIZE = 200;      // px
const STROKE = 8;        // épaisseur du trait
const COLOR = '#111827';
const ROT_TIME = 0.8;      // s – rotation 90°
const MORPH_TIME = 0.8;      // s – 8 fermé  →  8 ouvert
const EASING = 'easeInOut';

const InfinityToOpenedEight: React.FC<{ restartKey?: any }> = ({ restartKey }) => {
    /* ---------- chemins SVG ----------
       Tous dessinés dans la même viewBox (0-100)
    */
    const infinityPath = `
    M10 50
    C10 25 30 25 50 50
    C70 75 90 75 90 50
    C90 25 70 25 50 50
    C30 75 10 75 10 50
    Z`;

    // 8 debout (exacte même topologie que le symbole infini mais sans rotation dans le path)
    const eightPath = `
    M50 10
    C75 10 75 30 50 50
    C25 70 25 90 50 90
    C75 90 75 70 50 50
    C25 30 25 10 50 10
    Z`;

    // 8 « ouvert » : on tire les deux points les plus à gauche vers l’extérieur
    const eightOpenPath = `
    M50 10
    C80 10 78 30 52 48
    C78 65 80 90 50 90
    C28 90 28 68 40 52
    C28 35 28 12 50 10
    Z`;

    /* ---------- contrôles d’animations ---------- */
    const groupControls = useAnimation();  // pour la rotation
    const pathControls = useAnimation();  // pour le morphing

    useEffect(() => {
        (async () => {
            // 1) reset
            await groupControls.set({ rotate: 0 });
            await pathControls.set({ d: infinityPath });

            // 2) rotation 90°
            await groupControls.start({
                rotate: 90,
                transition: { duration: ROT_TIME, ease: EASING },
            });

            // 3) morph de 8 fermé → 8 ouvert
            const interp = flubber.interpolate(eightPath, eightOpenPath, {
                maxSegmentLength: 2,
            });
            const steps = 30;
            const keyframes = Array.from({ length: steps + 1 }, (_, i) =>
                interp(i / steps),
            );

            await pathControls.start({
                d: keyframes,
                transition: { duration: MORPH_TIME, ease: 'linear' },
            });
        })();
    }, [restartKey, groupControls, pathControls]);

    /* ---------- rendu ---------- */
    return (
        <svg
            width={SIZE}
            height={SIZE}
            viewBox="0 0 100 100"
            style={{ display: 'block' }}
        >
            <motion.g animate={groupControls} style={{ originX: '50%', originY: '50%' }}>
                <motion.path
                    d={infinityPath}
                    animate={pathControls}
                    fill="none"
                    stroke={COLOR}
                    strokeWidth={STROKE}
                    strokeLinecap="round"
                />
            </motion.g>
        </svg>
    );
};

export default InfinityToOpenedEight;