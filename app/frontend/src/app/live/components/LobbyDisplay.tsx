'use client';

import React, { useState } from 'react';
import { Share2, QrCode } from 'lucide-react';
import LobbyLayout from '@/components/LobbyLayout';
import InfoModal from '@/components/SharedModal';
import QrCodeWithLogo from '@/components/QrCodeWithLogo';
import { createLogger } from '@/clientLogger';
import type { GameParticipant } from '@shared/types/core/participant';

const logger = createLogger('LobbyDisplay');

interface LobbyDisplayProps {
    lobbyState: {
        participants: GameParticipant[];
        creator: GameParticipant | null;
        countdown: number | null;
    };
    gameMode: string;
    userId: string | null;
    socket: any;
    code: string | string[] | undefined;
    startClicked: boolean;
    setStartClicked: (clicked: boolean) => void;
}

const LobbyDisplay = React.memo(({
    lobbyState,
    gameMode,
    userId,
    socket,
    code,
    startClicked,
    setStartClicked
}: LobbyDisplayProps) => {
    const [showQrModal, setShowQrModal] = useState(false);

    // Debug logging (only in debug mode)
    if (typeof window !== 'undefined' && window.location.search.includes('mqdebug=1')) {
        logger.info('[LOBBY] Rendering lobby with unified participant model', {
            participantCount: lobbyState.participants.length,
            creator: lobbyState.creator?.username
        });
    }

    // Determine if current user is the creator
    const isCreator = lobbyState.creator && lobbyState.creator.userId === userId;

    // Render the start button only for the creator and tournament mode
    const startButton = isCreator && gameMode === 'tournament' && !startClicked ? (
        <div className="flex justify-end w-full mt-4">
            <button
                className="btn btn-primary btn-lg px-6"
                onClick={() => {
                    if (socket) {
                        socket.emit('start_tournament', { accessCode: typeof code === 'string' ? code : String(code) });
                        setStartClicked(true);
                    }
                }}
            >
                Démarrer
            </button>
        </div>
    ) : null;

    // Share and QR buttons
    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: 'Rejoindre la partie',
                text: `Rejoignez la partie sur Kutsum avec le code : ${code}`,
                url: window.location.href
            }).catch(() => { });
        } else {
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const shareButton = (
        <div className="flex gap-0 items-center">
            <button
                className="p-2 rounded hover:bg-[color:var(--muted)] transition-colors"
                title="Partager le lien"
                onClick={handleShare}
            >
                {/* Share icon from lucide-react */}
                <span className="sr-only">Partager</span>
                <Share2 size={20} />
            </button>
            <button
                className="p-2 rounded hover:bg-[color:var(--muted)] transition-colors"
                title="QR Code"
                onClick={() => setShowQrModal(true)}
            >
                <span className="sr-only">QR Code</span>
                <QrCode size={20} />
            </button>
        </div>
    );

    return (
        <>
            <LobbyLayout
                creator={lobbyState.creator ? (
                    <>
                        <div className="w-[50px] h-[50px] rounded-full border-2 flex items-center justify-center text-3xl" style={{ borderColor: "var(--secondary)" }}>
                            {lobbyState.creator.avatarEmoji}
                        </div>
                        <span className="font-bold text-lg truncate">{lobbyState.creator.username}</span>
                    </>
                ) : <span>Chargement...</span>}
                code={null}
                shareButton={shareButton}
                participantsHeader={<div className="font-semibold text-lg">Participants connectés</div>}
                participantsList={lobbyState.participants.map((p, i) => (
                    <div key={p.userId ? `${p.userId}-${i}` : i} className="flex flex-col items-center">
                        <div className="w-[49px] h-[49px] rounded-full border-2 flex items-center justify-center text-3xl" style={{ borderColor: "var(--primary)" }}>{p.avatarEmoji}</div>
                        <span className="text-sm mt-0 truncate max-w-[70px]">{p.username}</span>
                    </div>
                ))}
                startButton={startButton}
                countdown={lobbyState.countdown !== null ? <div className="text-5xl font-extrabold text-primary mt-2 text-right w-full">{lobbyState.countdown}</div> : null}
            />
            {/* QR Modal */}
            <InfoModal
                isOpen={showQrModal}
                onClose={() => setShowQrModal(false)}
                title={null}
                size="sm"
                showCloseButton={false}
            >
                <div className="flex flex-col items-center justify-center gap-0 p-0">
                    <div className="flex items-center justify-center w-full" style={{ minWidth: 220, minHeight: 220 }}>
                        <QrCodeWithLogo
                            value={window.location.href}
                            size={220}
                            logoWidth={45}
                            logoHeight={45}
                            responsive={false}
                            style={{ width: 220, height: 220 }}
                        />
                    </div>
                    <div className="flex justify-end w-full mt-4">
                        <button
                            className="px-4 py-2 border border-[color:var(--border)] rounded-lg hover:bg-[color:var(--muted)] transition min-w-[100px]"
                            onClick={() => setShowQrModal(false)}
                        >
                            Fermer
                        </button>
                    </div>
                </div>
            </InfoModal>
        </>
    );
});

LobbyDisplay.displayName = 'LobbyDisplay';

export default LobbyDisplay;
