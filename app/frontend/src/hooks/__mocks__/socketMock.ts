import { Socket } from 'socket.io-client';
import { SOCKET_EVENTS } from '@shared/types/socket/events';

export function createMockSocket(): jest.Mocked<Socket> {
    return {
        id: 'mock-socket-id',
        connected: true,
        on: jest.fn(),
        off: jest.fn(),
        emit: jest.fn(),
        disconnect: jest.fn(),
        connect: jest.fn(),
        removeAllListeners: jest.fn(),
        // Add other socket methods as needed
    } as unknown as jest.Mocked<Socket>;
}
