import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { RedisService } from '../../services/redis.service';

@WebSocketGateway({ cors: { origin: 'http://localhost:5173/' }, transports: ['websocket'] })
@Injectable()
export class PaymentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private clients: Map<number, Socket> = new Map();

  constructor(private readonly redisService: RedisService) { }

  handleConnection(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    if (userId) {
      this.clients.set(userId, client);
      // Send any pending messages stored in Redis
      this.sendPendingMessages(userId, client);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Number(client.handshake.query.userId);
    this.clients.delete(userId);
  }

  /** Send QR only if no QR was sent in the last 3 minutes */
  async sendQr(userId: number, qrCode: string) {
    const client = this.clients.get(userId);
    const redisKey = `user:${userId}:qr_lock`;
    const messageKey = `user:${userId}:pending_message`;

    // Check lock
    const lock = await this.redisService.getClient().get(redisKey);
    if (lock) {
      console.log(`User ${userId} already has a QR recently.`);
      return;
    }

    // Set lock for 3 minutes
    await this.redisService.getClient().set(redisKey, 'locked', 'EX', 180);

    const message = { type: 'QR_READY', payload: { qr: qrCode } };

    if (client) {
      client.emit('QR_READY', { qr: qrCode });
    } else {
      // Store message in Redis for offline delivery
      await this.redisService.getClient().set(messageKey, JSON.stringify(message));
    }
  }

  /** Send payment status */
  async sendStatus(userId: number, status: string) {
    const client = this.clients.get(userId);
    const messageKey = `user:${userId}:pending_message`;

    const message = { type: 'PAYMENT_STATUS', payload: { status } };

    if (client) {
      client.emit('PAYMENT_STATUS', { status });
    } else {
      // Store message in Redis for offline delivery
      await this.redisService.getClient().set(messageKey, JSON.stringify(message));
    }
  }

  /** Send any pending messages stored in Redis */
  private async sendPendingMessages(userId: number, client: Socket) {
    const messageKey = `user:${userId}:pending_message`;
    const stored = await this.redisService.getClient().get(messageKey);
    if (stored) {
      const message = JSON.parse(stored);
      client.emit(message.type, message.payload);
      // Clear pending message after delivery
      await this.redisService.getClient().del(messageKey);
    }
  }
}