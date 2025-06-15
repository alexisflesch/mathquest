"use client";

import InfinityToOpenedEight from "@/components/InfinityCountDown";
import React, { useState } from 'react';
// import InfinityToOpenedEight from './InfinityToOpenedEight';

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