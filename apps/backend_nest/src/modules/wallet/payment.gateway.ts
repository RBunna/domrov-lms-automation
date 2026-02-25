import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import type { Cache } from 'cache-manager';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: 'http://localhost:5173' }, transports: ['websocket'] })
export class PaymentGateway {
  @WebSocketServer()
  server: Server;
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache, private jwtService: JwtService,
  ) { }
  private clients: Map<number, Socket> = new Map();


  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) throw new Error('No token');

    const payload = this.jwtService.verify(token);

    const userId = payload.sub;
    client.data.userId = userId;


    this.clients.set(userId, client);

    const session = await this.cacheManager.get<{
      qr?: string;
      status?: string;
    }>(`payment:${userId}`);

    if (!session) return;

    // replay QR if exists
    if (session.qr && session.status === 'PENDING') {
      client.emit('QR_READY', { qr: session.qr });
    }

    // replay final status
    if (session.status === 'SUCCESS' || session.status === 'FAILED') {
      client.emit('PAYMENT_STATUS', { status: session.status });
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Number(client.handshake.query.userId);

    if (this.clients.get(userId)?.id === client.id) {
      this.clients.delete(userId);
    }
  }

  async sendQr(userId: number, qrCode: string) {
    await this.cacheManager.set(
      `payment:${userId}`,
      { qr: qrCode, status: 'PENDING' },
      180000,
    );

    const client = this.clients.get(userId);
    if (client) client.emit('QR_READY', { qr: qrCode });
  }

  async sendStatus(userId: number, status: string) {
    const existing =
      (await this.cacheManager.get<any>(`payment:${userId}`)) || {};

    await this.cacheManager.set(
      `payment:${userId}`,
      { ...existing, status },
      180000,
    );

    const client = this.clients.get(userId);
    if (client) client.emit('PAYMENT_STATUS', { status });
  }
}