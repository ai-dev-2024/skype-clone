import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import User from '../models/User';
import Message from '../models/Message';
import Call from '../models/Call';
import Group from '../models/Group';
import Contact from '../models/Contact';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: any;
}

export const setupSocketHandlers = (io: Server) => {
  // Middleware to authenticate socket connections
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await User.findById(decoded.id);

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = (user._id as Types.ObjectId).toString();
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.username} connected with socket ${socket.id}`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle user connection
    socket.on('user:connect', async (userId: string) => {
      try {
        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date()
        });

        // Notify all contacts that user is online
        const contacts = await Contact.getUserContacts(userId);
        contacts.forEach(contact => {
          const contactId = (contact as any).contactId?._id
            ? (contact as any).contactId._id.toString()
            : contact.contactId?.toString?.() ?? String(contact.contactId);

          socket.to(`user:${contactId}`).emit('user:online', {
            id: userId,
            username: socket.user?.username,
            firstName: socket.user?.firstName,
            lastName: socket.user?.lastName,
            avatar: socket.user?.avatar,
            isOnline: true,
            lastSeen: new Date(),
            email: socket.user?.email,
            createdAt: socket.user?.createdAt ?? new Date(),
            updatedAt: new Date()
          });
        });
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    });

    // Handle message sending
    socket.on('message:send', async (messageData) => {
      try {
        const message = await Message.create({
          ...messageData,
          senderId: socket.userId
        });

        const populatedMessage = await Message.findById(message._id)
          .populate('senderId', 'username firstName lastName avatar');

        // Send to receiver or group
        if (messageData.receiverId) {
          socket.to(`user:${messageData.receiverId}`).emit('message:new', populatedMessage);
        } else if (messageData.groupId) {
          socket.to(`group:${messageData.groupId}`).emit('message:new', populatedMessage);
        }

        // Send back to sender for confirmation
        socket.emit('message:new', populatedMessage);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle message read
    socket.on('message:mark-read', async (messageId: string) => {
      try {
        const message = await Message.findById(messageId);
        if (message && message.receiverId === socket.userId && !message.isRead) {
          await Message.findByIdAndUpdate(messageId, {
            isRead: true,
            readAt: new Date()
          });

          // Notify sender that message was read
          socket.to(`user:${message.senderId}`).emit('message:read', messageId);
        }
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    });

    // Handle call initiation
    socket.on('call:initiate', async (callData) => {
      try {
        const call = await Call.create({
          ...callData,
          callerId: socket.userId,
          status: 'initiated'
        });

        const populatedCall = await Call.findById(call._id)
          .populate('callerId', 'username firstName lastName avatar');

        // Send to receiver or group
        if (callData.receiverId) {
          socket.to(`user:${callData.receiverId}`).emit('call:incoming', populatedCall);
        } else if (callData.groupId) {
          socket.to(`group:${callData.groupId}`).emit('call:incoming', populatedCall);
        }
      } catch (error) {
        console.error('Error initiating call:', error);
        socket.emit('error', 'Failed to initiate call');
      }
    });

    // Handle call acceptance
    socket.on('call:accept', async (callId: string) => {
      try {
        const call = await Call.findById(callId);
        if (call && (call.receiverId === socket.userId || call.groupId)) {
          await Call.updateCallStatus(callId, 'answered', { startTime: new Date() });

          // Notify caller
          socket.to(`user:${call.callerId}`).emit('call:accepted', callId);
        }
      } catch (error) {
        console.error('Error accepting call:', error);
      }
    });

    // Handle call decline
    socket.on('call:decline', async (callId: string) => {
      try {
        const call = await Call.findById(callId);
        if (call) {
          const receiverId = call.receiverId ? call.receiverId.toString() : undefined;
          const groupId = call.groupId ? call.groupId.toString() : undefined;

          if (receiverId === socket.userId || groupId) {
          await Call.updateCallStatus(callId, 'declined');

          // Notify caller
            socket.to(`user:${call.callerId}`).emit('call:declined', callId);
          }
        }
      } catch (error) {
        console.error('Error declining call:', error);
      }
    });

    // Handle call end
    socket.on('call:end', async (callId: string) => {
      try {
        const call = await Call.findById(callId);
        if (call) {
          const callerId = call.callerId ? call.callerId.toString() : undefined;
          const receiverId = call.receiverId ? call.receiverId.toString() : undefined;
          const groupId = call.groupId ? call.groupId.toString() : undefined;

          if (callerId === socket.userId || receiverId === socket.userId || groupId) {
          await Call.updateCallStatus(callId, 'ended', { endTime: new Date() });

          // Notify all participants
            if (receiverId) {
              socket.to(`user:${receiverId}`).emit('call:ended', callId);
            } else if (groupId) {
              socket.to(`group:${groupId}`).emit('call:ended', callId);
            }
          }
        }
      } catch (error) {
        console.error('Error ending call:', error);
      }
    });

    // Handle group creation
    socket.on('group:create', async (groupData) => {
      try {
        const group = await Group.createGroup(
          groupData.name,
          groupData.description,
          socket.userId!,
          groupData.members,
          groupData.isPrivate
        );

        const populatedGroup = await Group.findById(group._id)
          .populate('createdBy', 'username firstName lastName avatar')
          .populate('members', 'username firstName lastName avatar');

        // Notify all members
        group.members.forEach(memberId => {
          const targetId = memberId.toString();
          socket.to(`user:${targetId}`).emit('group:created', populatedGroup);
        });

        // Add to group room
        socket.join(`group:${group._id}`);
      } catch (error) {
        console.error('Error creating group:', error);
        socket.emit('error', 'Failed to create group');
      }
    });

    // Handle group join
    socket.on('group:join', async (groupId: string) => {
      try {
        const group = await Group.findById(groupId);
        if (group && group.isMember(socket.userId!)) {
          socket.join(`group:${groupId}`);
          socket.emit('group:joined', groupId);
        }
      } catch (error) {
        console.error('Error joining group:', error);
      }
    });

    // Handle group leave
    socket.on('group:leave', async (groupId: string) => {
      try {
        const group = await Group.findById(groupId);
        if (group && group.isMember(socket.userId!)) {
          socket.leave(`group:${groupId}`);
          socket.emit('group:left', groupId);
        }
      } catch (error) {
        console.error('Error leaving group:', error);
      }
    });

    // Handle contact request
    socket.on('contact:add', async (contactId: string) => {
      try {
        await Contact.sendRequest(socket.userId!, contactId);

        // Notify the contact user
        socket.to(`user:${contactId}`).emit('contact:request', {
          fromUserId: socket.userId,
          username: socket.user?.username
        });
      } catch (error) {
        console.error('Error sending contact request:', error);
        socket.emit('error', 'Failed to send contact request');
      }
    });

    // Handle contact acceptance
    socket.on('contact:accept', async (contactId: string) => {
      try {
        await Contact.acceptRequest(socket.userId!, contactId);

        // Notify both users
        socket.to(`user:${contactId}`).emit('contact:accepted', {
          userId: socket.userId,
          username: socket.user?.username
        });
      } catch (error) {
        console.error('Error accepting contact request:', error);
        socket.emit('error', 'Failed to accept contact request');
      }
    });

    // Handle contact block
    socket.on('contact:block', async (contactId: string) => {
      try {
        await Contact.blockContact(socket.userId!, contactId);
        socket.emit('contact:blocked', contactId);
      } catch (error) {
        console.error('Error blocking contact:', error);
        socket.emit('error', 'Failed to block contact');
      }
    });

    // Handle WebRTC offer
    socket.on('webrtc:offer', (offer) => {
      if (offer.receiverId) {
        socket.to(`user:${offer.receiverId}`).emit('webrtc:offer', offer);
      } else if (offer.groupId) {
        socket.to(`group:${offer.groupId}`).emit('webrtc:offer', offer);
      }
    });

    // Handle WebRTC answer
    socket.on('webrtc:answer', (answer) => {
      socket.to(`user:${answer.callerId}`).emit('webrtc:answer', answer);
    });

    // Handle WebRTC ICE candidate
    socket.on('webrtc:ice-candidate', (candidate) => {
      if (candidate.callerId) {
        socket.to(`user:${candidate.callerId}`).emit('webrtc:ice-candidate', candidate);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User ${socket.user?.username} disconnected`);

      try {
        await User.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date()
        });

        // Notify contacts that user is offline
        const contacts = await Contact.getUserContacts(socket.userId!);
        contacts.forEach(contact => {
          const contactId = (contact as any).contactId?._id
            ? (contact as any).contactId._id.toString()
            : contact.contactId?.toString?.() ?? String(contact.contactId);
          socket.to(`user:${contactId}`).emit('user:offline', socket.userId!);
        });
      } catch (error) {
        console.error('Error updating user status on disconnect:', error);
      }
    });
  });
};
