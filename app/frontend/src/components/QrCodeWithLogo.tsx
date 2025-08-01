"use client"
import React, { useRef, useEffect, useState, useCallback } from 'react';
import '@/app/globals.css';
import { QRCode } from 'react-qrcode-logo';
import { z } from 'zod';

// Longer debounce for crisp re-rendering
const useDebounce = (value: number, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);

        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);

    return debouncedValue;
};

const QrCodeWithLogoPropsSchema = z.object({
    value: z.string(),
    size: z.number().min(64).max(1024).optional(),
    logoWidth: z.number().min(16).max(512).optional(),
    logoHeight: z.number().min(16).max(512).optional(),
    bgColor: z.string().optional(),
    fgColor: z.string().optional(),
    responsive: z.boolean().optional().default(false),
});

export type QrCodeWithLogoProps = z.infer<typeof QrCodeWithLogoPropsSchema> & {
    style?: React.CSSProperties;
};

const QrCodeWithLogo: React.FC<QrCodeWithLogoProps> = (props) => {
    const { style, ...rest } = props;
    const parsed = QrCodeWithLogoPropsSchema.safeParse(rest);
    if (!parsed.success) {
        throw new Error('Invalid props for QrCodeWithLogo: ' + JSON.stringify(parsed.error.issues));
    }
    const { value, size: propSize, logoWidth, logoHeight, bgColor, fgColor } = parsed.data;

    // Always render at high resolution for crisp scaling
    const highResSize = 1024;
    const displaySize = propSize || 256;

    return (
        <div
            className="qr-container"
            style={{
                width: '100%',
                height: '100%',
                display: 'grid',
                placeItems: 'center',
                containerType: 'size', // Enable container queries
                ...style
            }}
        >
            <div
                className="qr-square"
                style={{
                    width: '100cqmin', // 100% of the smaller container dimension
                    aspectRatio: '1 / 1',
                    position: 'relative'
                }}
            >
                <QRCode
                    value={value}
                    size={highResSize}
                    logoImage="/favicon.svg"
                    logoWidth={logoWidth ? (logoWidth * highResSize) / displaySize : undefined}
                    logoHeight={logoHeight ? (logoHeight * highResSize) / displaySize : undefined}
                    logoPadding={5}
                    logoPaddingStyle="square"
                    removeQrCodeBehindLogo={true}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    ecLevel="H"
                    qrStyle="dots"
                    eyeRadius={8}
                    style={{
                        width: '100%',
                        height: '100%',
                        imageRendering: 'crisp-edges'
                    }}
                />
            </div>
        </div>
    );
};

export default QrCodeWithLogo;