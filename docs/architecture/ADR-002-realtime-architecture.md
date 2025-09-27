# ADR-002: Real-time Communication Architecture

## Status
Accepted

## Context
The application requires real-time messaging and video calling capabilities. We evaluated several technologies for implementing WebSocket-based communication and peer-to-peer video calling.

Key requirements:
- Real-time messaging with delivery guarantees
- Video/audio calling with low latency
- Scalability to thousands of concurrent users
- Cross-platform compatibility
- Security and authentication

## Decision
We will use **Socket.io for messaging and WebRTC for video calling** with the following architecture:

### Messaging Layer (Socket.io)
- **Transport**: WebSocket with HTTP polling fallback
- **Authentication**: JWT tokens with socket middleware
- **Room Management**: Dynamic room creation for conversations
- **Message Persistence**: MongoDB with optimistic UI updates

### Video Calling Layer (WebRTC)
- **Peer Connection**: Direct peer-to-peer when possible
- **STUN/TURN Servers**: For NAT traversal
- **Signaling**: Socket.io for WebRTC handshake
- **Fallback**: Server-mediated calling for complex networks

## Implementation

### Socket.io Configuration
```typescript
import { Server } from 'socket.io';
import { authenticateSocket } from './middleware/auth';

const io = new Server(server, {
  cors: { origin: process.env.CLIENT_URL },
  transports: ['websocket', 'polling']
});

io.use(authenticateSocket);
io.on('connection', handleSocketConnection);
```

### WebRTC Signaling Flow
```
1. Caller initiates call → Socket.io signaling
2. Callee receives offer → WebRTC peer connection
3. ICE candidate exchange → STUN/TURN servers
4. Media stream establishment → Direct P2P connection
5. Call management → Socket.io control messages
```

## Consequences

### Positive
- **Low Latency**: Direct WebRTC connections for media
- **Scalability**: Socket.io clustering support
- **Reliability**: Automatic reconnection and fallback
- **Security**: JWT authentication for all connections
- **Cross-platform**: Works on all target platforms

### Negative
- **NAT Complexity**: Requires STUN/TURN infrastructure
- **Browser Support**: WebRTC API differences across browsers
- **Network Dependencies**: Relies on network conditions
- **Debugging Difficulty**: Complex network troubleshooting

### Mitigation
- Implement comprehensive fallback mechanisms
- Use commercial STUN/TURN services (Twilio, Xirsys)
- Add network diagnostics and quality monitoring
- Implement call quality metrics and reporting

## Alternatives Considered

### Pure WebRTC (Without Socket.io)
**Pros**: Simpler architecture, direct P2P
**Cons**: No messaging, complex signaling, no fallbacks

### WebRTC + Custom Signaling Server
**Pros**: Full control, optimized signaling
**Cons**: Reimplement battle-tested features, maintenance burden

### Third-party Services (Twilio, Agora)
**Pros**: Managed infrastructure, global CDN
**Cons**: Vendor lock-in, higher costs, less customization

## Performance Benchmarks

### Target Metrics
- **Connection Time**: < 500ms
- **Message Latency**: < 100ms
- **Video Quality**: 720p @ 30fps
- **Concurrent Users**: 1000+ per server instance

### Monitoring
- WebRTC stats API integration
- Socket.io connection monitoring
- Network quality indicators
- Performance dashboards

## Security Considerations

### Authentication
- JWT token validation on socket connection
- Room access control
- User identity verification

### Encryption
- WSS (WebSocket Secure) for signaling
- DTLS for WebRTC media encryption
- End-to-end encryption for sensitive data

### Privacy
- No persistent media storage
- Ephemeral key exchange
- User consent for media access

## References
- [WebRTC Protocol](https://webrtc.org/)
- [Socket.io Documentation](https://socket.io/docs/)
- [WebRTC Security](https://w3c.github.io/webrtc-security/)

---

*Date: September 27, 2025*
*Authors: Backend-Lead*
