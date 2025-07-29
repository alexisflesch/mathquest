import React from "react";

interface LobbyLayoutProps {
  creator: React.ReactNode;
  code: React.ReactNode;
  shareButton: React.ReactNode;
  participantsHeader: React.ReactNode;
  participantsList: React.ReactNode;
  startButton?: React.ReactNode;
  countdown?: React.ReactNode;
}

/**
 * LobbyLayout
 *
 * Extracted layout for the tournament lobby page. All content is passed as props.
 * No logic or state is included here.
 */
export default function LobbyLayout({
  creator,
  code,
  shareButton,
  participantsHeader,
  participantsList,
  startButton,
  countdown,
}: LobbyLayoutProps) {
  return (
    <div className="main-content">
      <div className="card w-full max-w-2xl bg-base-100 rounded-lg shadow-xl my-6">
        <div className="flex flex-col gap-8 w-full">
          {/* First row: Avatar/username | Code | Share button */}
          <div className="flex flex-row items-center justify-between w-full gap-4">
            {/* Avatar + username */}
            <div className="flex items-center gap-3 min-w-0">
              {creator}
            </div>
            {/* Tournament code */}
            <div className="flex flex-col items-center flex-1">
              {code}
            </div>
            {/* Share button */}
            {shareButton}
          </div>
          <hr className="w-full border-base-300" />
          <div className="w-full mt-0 mb-0 text-left">
            {participantsHeader}
            <div className="h-4" />
          </div>
          <div className="w-full flex flex-col gap-0">
            <div className="flex-1 min-h-0 overflow-y-auto flex flex-wrap gap-4 justify-start w-full" style={{ maxHeight: '40vh' }}>
              {participantsList}
            </div>
            {startButton}
            {countdown}
          </div>
        </div>
      </div>
    </div>
  );
}
