import React from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface GoodAnswerProps {
    iconColor?: string;
    size?: number;
    className?: string;
}

/**
 * GoodAnswer component: shows a checkmark with zoom-in + fade-in animation.
 * @param iconColor - color of the checkmark (CSS color string)
 * @param size - icon size in px (default 32)
 * @param className - optional className for the wrapper
 */
const GoodAnswer: React.FC<GoodAnswerProps> = ({ iconColor = "#10b981", size = 32, className }) => {
    return (
        <AnimatePresence>
            <motion.span
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ defaultMode: "spring", stiffness: 400, damping: 24, duration: 0.4 }}
                className={className}
                style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}
            >
                <Check size={size} color={iconColor} strokeWidth={3} />
            </motion.span>
        </AnimatePresence>
    );
};

export default GoodAnswer;
