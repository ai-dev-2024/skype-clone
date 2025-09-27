import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  StyleSheet,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import {Text, IconButton, Surface, useTheme} from 'react-native-paper';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {RootStackParamList} from '../../App';
import {useAuth} from '../../contexts/AuthContext';
import {useSocket} from '../../contexts/SocketContext';
import {RTCView} from 'react-native-webrtc';

type CallScreenRouteProp = RouteProp<RootStackParamList, 'Call'>;
type CallScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Call'>;

interface CallParticipant {
  id: string;
  name: string;
  avatar?: string;
  stream?: any;
  isMuted: boolean;
  isVideoEnabled: boolean;
}

const {width, height} = Dimensions.get('window');

const CallScreen: React.FC = () => {
  const [participants, setParticipants] = useState<CallParticipant[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');

  const {user} = useAuth();
  const {socket} = useSocket();
  const navigation = useNavigation<CallScreenNavigationProp>();
  const route = useRoute<CallScreenRouteProp>();
  const theme = useTheme();

  const {callId, isOutgoing, participants: participantIds} = route.params;
  const callStartTime = useRef<Date | null>(null);
  const callTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    initializeCall();
    setupSocketListeners();

    return () => {
      cleanupCall();
    };
  }, []);

  useEffect(() => {
    if (callStatus === 'connected' && !callStartTime.current) {
      callStartTime.current = new Date();
      callTimer.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }

    return () => {
      if (callTimer.current) {
        clearInterval(callTimer.current);
      }
    };
  }, [callStatus]);

  const initializeCall = async () => {
    try {
      // Initialize WebRTC
      // This would involve setting up peer connections, getting user media, etc.

      // Set up initial participants
      const initialParticipants: CallParticipant[] = participantIds.map(id => ({
        id,
        name: `Participant ${id.slice(-4)}`, // Placeholder
        isMuted: false,
        isVideoEnabled: true,
      }));

      setParticipants(initialParticipants);

      if (isOutgoing) {
        // Start outgoing call
        socket?.emit('startCall', {
          callId,
          participants: participantIds,
          caller: user?._id,
        });
      } else {
        // Join incoming call
        socket?.emit('joinCall', {callId});
      }
    } catch (error) {
      console.error('Error initializing call:', error);
      Alert.alert('Error', 'Failed to initialize call');
      navigation.goBack();
    }
  };

  const setupSocketListeners = () => {
    if (!socket) return;

    socket.on('callAccepted', (data) => {
      setCallStatus('connected');
      // Update participant streams
    });

    socket.on('callRejected', (data) => {
      Alert.alert('Call Rejected', 'The other party declined the call');
      navigation.goBack();
    });

    socket.on('callEnded', (data) => {
      setCallStatus('ended');
      Alert.alert('Call Ended', 'The call has ended');
      navigation.goBack();
    });

    socket.on('participantJoined', (participant) => {
      setParticipants(prev => [...prev, participant]);
    });

    socket.on('participantLeft', (participantId) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    });
  };

  const cleanupCall = () => {
    // Clean up WebRTC connections
    // Stop media streams
    // Clean up socket listeners

    if (socket) {
      socket.off('callAccepted');
      socket.off('callRejected');
      socket.off('callEnded');
      socket.off('participantJoined');
      socket.off('participantLeft');
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement actual mute/unmute logic with WebRTC
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
    // Implement actual video enable/disable logic with WebRTC
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Implement speaker toggle
  };

  const endCall = () => {
    socket?.emit('endCall', {callId});
    navigation.goBack();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const renderParticipant = (participant: CallParticipant, index: number) => {
    const isLarge = participants.length === 1;

    return (
      <Surface
        key={participant.id}
        style={[
          styles.participantContainer,
          isLarge ? styles.largeParticipant : styles.smallParticipant,
        ]}
        elevation={2}
      >
        {participant.stream && participant.isVideoEnabled ? (
          <RTCView
            streamURL={participant.stream.toURL()}
            style={styles.videoStream}
            objectFit="cover"
          />
        ) : (
          <View style={[styles.avatarContainer, isLarge && styles.largeAvatar]}>
            <Text style={styles.participantInitial}>
              {participant.name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.participantInfo}>
          <Text style={styles.participantName} numberOfLines={1}>
            {participant.name}
          </Text>
          {participant.isMuted && (
            <IconButton
              icon="microphone-off"
              size={16}
              iconColor="#FF3B30"
              style={styles.mutedIcon}
            />
          )}
        </View>
      </Surface>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.callStatus}>
          {callStatus === 'connecting' ? 'Connecting...' :
           callStatus === 'connected' ? formatDuration(callDuration) :
           'Call Ended'}
        </Text>
      </View>

      {/* Video Grid */}
      <View style={styles.videoContainer}>
        {participants.map((participant, index) => renderParticipant(participant, index))}
      </View>

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controls}>
          <IconButton
            icon={isMuted ? "microphone-off" : "microphone"}
            size={32}
            mode="contained"
            containerColor={isMuted ? "#FF3B30" : "#34C759"}
            iconColor="white"
            onPress={toggleMute}
            style={styles.controlButton}
          />

          <IconButton
            icon={isVideoEnabled ? "video" : "video-off"}
            size={32}
            mode="contained"
            containerColor={isVideoEnabled ? "#34C759" : "#FF3B30"}
            iconColor="white"
            onPress={toggleVideo}
            style={styles.controlButton}
          />

          <IconButton
            icon={isSpeakerOn ? "volume-high" : "volume-medium"}
            size={32}
            mode="contained"
            containerColor="#007AFF"
            iconColor="white"
            onPress={toggleSpeaker}
            style={styles.controlButton}
          />

          <IconButton
            icon="phone-hangup"
            size={32}
            mode="contained"
            containerColor="#FF3B30"
            iconColor="white"
            onPress={endCall}
            style={styles.controlButton}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  callStatus: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  videoContainer: {
    flex: 1,
    padding: 10,
  },
  participantContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    margin: 5,
  },
  largeParticipant: {
    flex: 1,
    aspectRatio: 16/9,
  },
  smallParticipant: {
    width: (width - 30) / 2,
    height: (width - 30) / 2,
  },
  videoStream: {
    flex: 1,
  },
  avatarContainer: {
    flex: 1,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeAvatar: {
    backgroundColor: '#007AFF',
  },
  participantInitial: {
    color: 'white',
    fontSize: 48,
    fontWeight: 'bold',
  },
  participantInfo: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  participantName: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  mutedIcon: {
    margin: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  controlsContainer: {
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  controlButton: {
    margin: 0,
  },
});

export default CallScreen;
