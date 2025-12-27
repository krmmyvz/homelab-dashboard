import { io, Socket } from 'socket.io-client';

class WebSocketManager {
    private socket: Socket | null = null;
    private listeners: Map<string, Set<Function>> = new Map();
    public connectionStatus: 'connected' | 'disconnected' | 'connecting' | 'error' | 'failed' = 'disconnected';

    constructor() {
        // Bind methods to preserve context
        this.handleOnline = this.handleOnline.bind(this);
        this.handleOffline = this.handleOffline.bind(this);

        if (typeof window !== 'undefined') {
            window.addEventListener('online', this.handleOnline);
            window.addEventListener('offline', this.handleOffline);
        }
    }

    private handleOnline() {
        if (this.connectionStatus === 'disconnected') {
            this.connect();
        }
    }

    private handleOffline() {
        this.connectionStatus = 'disconnected';
        this.emit('disconnected', null);
    }

    connect() {
        if (this.socket?.connected) return;

        const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
        const host = window.location.host;
        const url = `${protocol}//${host}`;

        this.socket = io(url, {
            transports: ['websocket'],
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            this.connectionStatus = 'connected';
            this.emit('connected', null);
        });

        this.socket.on('disconnect', () => {
            this.connectionStatus = 'disconnected';
            this.emit('disconnected', null);
        });

        this.socket.on('connect_error', (error) => {
            this.connectionStatus = 'error';
            this.emit('error', error);
        });

        // Pipe all socket events to our listeners
        this.socket.onAny((event, ...args) => {
            this.emit(event, args[0]);
        });
    }

    send(event: string, data: any) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    on(event: string, callback: Function) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event)?.add(callback);
    }

    off(event: string, callback: Function) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.delete(callback);
        }
    }

    private emit(event: string, data: any) {
        if (this.listeners.has(event)) {
            this.listeners.get(event)?.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`❌ WebSocket event listener error (${event}):`, error);
                }
            });
        }
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.listeners.clear();
    }
}

export const websocketManager = new WebSocketManager();

if (typeof window !== 'undefined') {
    websocketManager.connect();
}

export default websocketManager;
