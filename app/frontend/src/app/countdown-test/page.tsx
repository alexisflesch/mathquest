"use client";

import InfinityToOpenedEight from "@/components/InfinityCountDown";
import React, { useState } from 'react';
// import InfinityToOpenedEight from './InfinityToOpenedEight';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export default function Demo() {
    const [key, setKey] = useState(Date.now());

    return (
        <div style={{ textAlign: 'center', padding: 40 }}>
            <InfinityToOpenedEight restartKey={key} />
            <button onClick={() => setKey(Date.now())}>
                Rejouer l’animation
            </button>
        </div>
    );
}