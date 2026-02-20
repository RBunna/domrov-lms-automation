import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// 1️⃣ ENABLE CORS: This is usually the main issue on localhost
@WebSocketGateway({ cors: { origin: '*' } }) 
export class PaymentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // 2️⃣ EMIT METHOD
  sendStatus(status: string) {
    console.log(`Broadcasting status: ${status}`); // Add log for debugging
    
    // 3️⃣ IMPORTANT: Wrap in an object to match your frontend 'data.status'
    this.server.emit('PAYMENT_STATUS', { status: status }); 
  }

  sendQr(qrCode: string) {
    this.server.emit('QR_READY', { qr: qrCode });
  }
}