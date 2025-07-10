import { motion } from 'framer-motion';
import { Trophy as LucideTrophy } from "lucide-react";
import { SOCKET_EVENTS } from '@shared/types/socket/events';

interface TrophyProps {
    size?: number;
    iconColor: string;
    className?: string;
}

const Trophy = ({ size = 64, iconColor, className = "" }: TrophyProps) => {
    return (
        <div className={`badge flex items-center justify-center p-0 ${className}`} style={{ width: size, height: size, minWidth: size, minHeight: size }}>
            <motion.div
                className="flex items-center justify-center"
                style={{ width: size, height: size, backgroundColor: "transparent", zIndex: 2 }}
                animate={{
                    y: [-3, 2, -3],
                    scale: [1, 1.08, 1],
                    rotate: [0, -2, 2, -2, 0]
                }}
                transition={{
                    duration: 1.2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "loop",
                    repeatDelay: 1
                }}
            >
                <LucideTrophy size={size} color={iconColor} strokeWidth={2.5} />
            </motion.div>
        </div>
    );
};

export default Trophy;
