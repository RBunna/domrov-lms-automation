// // If using standard socket.io-client
// import { io } from 'socket.io-client';

// // 1️⃣ Connect (Ensure port matches your NestJS main.ts port, usually 3000)
// const socket = io('http://localhost:3000'); 

// socket.on('connect', () => {
//   console.log('✅ Connected with ID:', socket.id);
// });

// socket.on('connect_error', (err) => {
//   console.error('❌ Connection failed:', err.message);
// });

// socket.on('QR_READY', (data) => {
//   console.log('📷 QR Received:', data.qr);
// });

// socket.on('PAYMENT_STATUS', (data) => {
//   // 2️⃣ Make sure the server sent an object { status: 'PAID' }
//   console.log('💰 Payment Status Update:', data.status); 
// });