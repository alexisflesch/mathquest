import { useTournamentGameManager } from './useUnifiedGameManager';
import type { UnifiedGameConfig } from './useUnifiedGameManager';

export function useTournamentSocket(props: UnifiedGameConfig) {
    return useTournamentGameManager(
        props.accessCode!,
        props.userId!,
        props.username!,
        props.avatarEmoji,
        props
    );
}
