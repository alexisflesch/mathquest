import React from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface WrongAnswerProps {
    iconColor?: string;
    size?: number;
    className?: string;
}

/**
 * WrongAnswer component: shows an X with a shake animation when appearing.
 * @param iconColor - color of the X (CSS color string)
 * @param size - icon size in px (default 32)
 * @param className - optional className for the wrapper
 */
const shakeKeyframes = [0, -10, 10, -8, 8, -4, 4, 0];

const WrongAnswer: React.FC<WrongAnswerProps> = ({ iconColor = "#ef4444", size = 32, className }) => {
    return (
        <AnimatePresence>
            <motion.span
                initial={{ x: 0, opacity: 0 }}
                animate={{ x: shakeKeyframes, opacity: 1 }}
                exit={{ x: 0, opacity: 0 }}
                transition={{
                    x: { defaultMode: "keyframes", times: [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1], duration: 0.5 },
                    opacity: { duration: 0.2 }
                }}
                className={className}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
                <X size={size} color={iconColor} strokeWidth={3} />
            </motion.span>
        </AnimatePresence>
    );
};

export default WrongAnswer;
