import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const API_BASE = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:5174';

export function VideoChatPage() {
  const userId = useMemo(() => `u_${Math.random().toString(36).slice(2)}`, []);
  const [roomId, setRoomId] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const socketRef = useRef<ReturnType<typeof io> | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const socket = io(`${API_BASE}/ws`, { transports: ['websocket'] });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  const startSession = async () => {
    const res = await fetch(`${API_BASE}/api/video/start`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': userId } });
    const data = await res.json();
    setSessionId(data.session.id);
    setRoomId(data.session.id);
  };

  const joinRoom = async () => {
    if (!roomId) return;
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    pcRef.current = pc;

    const local = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localStreamRef.current = local;
    local.getTracks().forEach((t) => pc.addTrack(t, local));
    if (localVideoRef.current) localVideoRef.current.srcObject = local;

    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };

    const socket = socketRef.current!;
    socket.emit('join-room', roomId);

    socket.on('signal', async ({ description, candidate }) => {
      if (description) {
        await pc.setRemoteDescription(description);
        if (description.type === 'offer') {
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit('signal', { roomId, description: pc.localDescription });
        }
      }
      if (candidate) {
        try { await pc.addIceCandidate(candidate); } catch {}
      }
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('signal', { roomId, candidate: e.candidate });
    };

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    socket.emit('signal', { roomId, description: pc.localDescription });
  };

  const endSession = async () => {
    if (sessionId) {
      await fetch(`${API_BASE}/api/video/${sessionId}/end`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-user-id': userId } });
    }
    pcRef.current?.close();
    pcRef.current = null;
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
  };

  const toggleCam = async () => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) videoTrack.enabled = !videoTrack.enabled;
  };

  const toggleMic = async () => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) audioTrack.enabled = !audioTrack.enabled;
  };

  const shareScreen = async () => {
    const pc = pcRef.current;
    if (!pc) return;
    const display = await (navigator.mediaDevices as any).getDisplayMedia({ video: true });
    const screenTrack = display.getVideoTracks()[0];
    const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video');
    if (sender) sender.replaceTrack(screenTrack);
    screenTrack.onended = () => {
      const local = localStreamRef.current;
      if (!local) return;
      const camTrack = local.getVideoTracks()[0];
      if (camTrack && sender) sender.replaceTrack(camTrack);
    };
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Video Seans</h1>
      <div className="flex gap-2">
        <button onClick={startSession} className="px-4 py-2 bg-indigo-600 rounded">Seans Başlat (1 kredi)</button>
        <input value={roomId} onChange={(e) => setRoomId(e.target.value)} placeholder="Oda ID" className="px-2 py-2 bg-neutral-900 border border-neutral-800 rounded" />
        <button onClick={joinRoom} className="px-4 py-2 bg-neutral-800 rounded">Odaya Katıl</button>
        <button onClick={endSession} className="px-4 py-2 bg-red-600 rounded">Seansı Bitir</button>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full rounded-lg bg-black" />
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full rounded-lg bg-black" />
      </div>
      <div className="flex gap-2">
        <button onClick={toggleCam} className="px-4 py-2 bg-neutral-800 rounded">Kamera Aç/Kapat</button>
        <button onClick={toggleMic} className="px-4 py-2 bg-neutral-800 rounded">Mikrofon Aç/Kapat</button>
        <button onClick={shareScreen} className="px-4 py-2 bg-neutral-800 rounded">Ekran Paylaş</button>
      </div>
    </div>
  );
}