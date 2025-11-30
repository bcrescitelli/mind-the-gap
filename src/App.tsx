import React, { useState, useEffect, useCallback } from 'react';
import { Trophy, Activity, Users, ArrowUp, CornerUpRight, FastForward, AlertCircle, Copy, Check, Menu, X, RotateCcw, Footprints, Info } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

/** --- FIREBASE SETUP --- */
const firebaseConfig = {
  apiKey: "AIzaSyB0PSNUKgfx7Vsfp1eZKdd71L6_mo-MIgw",
  authDomain: "mind-the-gap-9ccb7.firebaseapp.com",
  projectId: "mind-the-gap-9ccb7",
  storageBucket: "mind-the-gap-9ccb7.firebasestorage.app",
  messagingSenderId: "118481767440",
  appId: "1:118481767440:web:7cd2df6e9a0d45fab9ce95"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'mind-the-gap-v2';

/** --- CONFIG --- */
const CONFIG = {
  gridSize: 20,
  winScore: 5,
  landmarkSpacing: 3,
  handSize: 5,
  points: { Easy: 1, Medium: 2, Hard: 3, Rare: 4 },
  colors: [
    { name: 'Piccadilly', hex: '#1c3f94', tailwind: 'bg-blue-800', text: 'text-blue-800' }, 
    { name: 'District', hex: '#007229', tailwind: 'bg-green-700', text: 'text-green-700' }, 
    { name: 'Central', hex: '#e32017', tailwind: 'bg-red-600', text: 'text-red-600' }, 
    { name: 'Northern', hex: '#000000', tailwind: 'bg-slate-900', text: 'text-slate-900' }, 
  ],
};

type Category = 'Spiritual' | 'Thrilling' | 'Cultural' | 'Foodie' | 'Relaxing' | 'Nature' | 'Services' | 'Special';
type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Rare';

interface LandmarkType {
  id: string;
  name: string;
  category: Category;
  difficulty: Difficulty;
  supplyCount: number; 
  emoji: string;
  color: string; 
}

const CATEGORY_COLORS: Record<Category, string> = {
  Spiritual: 'bg-purple-600',
  Thrilling: 'bg-teal-500',
  Cultural: 'bg-rose-700', 
  Foodie: 'bg-orange-500',
  Relaxing: 'bg-sky-400',
  Nature: 'bg-green-600',
  Services: 'bg-red-600',
  Special: 'bg-slate-800'
};

const CATEGORY_DIFFICULTY: Record<Category, Difficulty> = {
  Spiritual: 'Rare',
  Thrilling: 'Medium',
  Cultural: 'Medium',
  Foodie: 'Easy',
  Relaxing: 'Hard',
  Nature: 'Medium',
  Services: 'Easy',
  Special: 'Easy'
};

// --- FULL LANDMARK LIST ---
const LANDMARK_TYPES: LandmarkType[] = [
  { id: 'l_cityhall', name: 'City Hall', category: 'Special', difficulty: 'Easy', supplyCount: 1, emoji: '🏛️', color: 'bg-slate-800' },
  // Spiritual
  { id: 'l_fortune', name: 'Fortune Teller', category: 'Spiritual', difficulty: 'Rare', supplyCount: 1, emoji: '🔮', color: CATEGORY_COLORS.Spiritual },
  { id: 'l_cemetery', name: 'Cemetery', category: 'Spiritual', difficulty: 'Rare', supplyCount: 1, emoji: '🪦', color: CATEGORY_COLORS.Spiritual },
  { id: 'l_antique', name: 'Antique Store', category: 'Spiritual', difficulty: 'Rare', supplyCount: 1, emoji: '🏺', color: CATEGORY_COLORS.Spiritual },
  // Thrilling
  { id: 'l_theme', name: 'Theme Park', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🎢', color: CATEGORY_COLORS.Thrilling },
  { id: 'l_zoo', name: 'Zoo', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🦁', color: CATEGORY_COLORS.Thrilling },
  { id: 'l_stadium', name: 'Stadium', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🏟️', color: CATEGORY_COLORS.Thrilling },
  { id: 'l_arcade', name: 'Arcade', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🕹️', color: CATEGORY_COLORS.Thrilling },
  { id: 'l_tattoo', name: 'Tattoo Parlor', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🐉', color: CATEGORY_COLORS.Thrilling },
  // Cultural
  { id: 'l_museum', name: 'Museum', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '🏛️', color: CATEGORY_COLORS.Cultural },
  { id: 'l_theatre', name: 'Theatre', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '🎭', color: CATEGORY_COLORS.Cultural },
  { id: 'l_cinema', name: 'Cinema', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '🍿', color: CATEGORY_COLORS.Cultural },
  { id: 'l_clock', name: 'Clock Tower', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '🕰️', color: CATEGORY_COLORS.Cultural },
  { id: 'l_library', name: 'Library', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '📚', color: CATEGORY_COLORS.Cultural },
  // Foodie
  { id: 'l_restaurant', name: 'Restaurant', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🍽️', color: CATEGORY_COLORS.Foodie },
  { id: 'l_deli', name: 'Deli', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🥪', color: CATEGORY_COLORS.Foodie },
  { id: 'l_sweet', name: 'Sweet Shop', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🍬', color: CATEGORY_COLORS.Foodie },
  { id: 'l_farmers', name: 'Farmers Market', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🥦', color: CATEGORY_COLORS.Foodie },
  { id: 'l_cafe', name: 'Cafe', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '☕', color: CATEGORY_COLORS.Foodie },
  { id: 'l_rooftop', name: 'Rooftop Bar', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🍸', color: CATEGORY_COLORS.Foodie },
  // Relaxing
  { id: 'l_pier', name: 'Pier', category: 'Relaxing', difficulty: 'Hard', supplyCount: 1, emoji: '🎡', color: CATEGORY_COLORS.Relaxing },
  { id: 'l_salon', name: 'Salon', category: 'Relaxing', difficulty: 'Hard', supplyCount: 1, emoji: '💇', color: CATEGORY_COLORS.Relaxing },
  { id: 'l_park', name: 'Park', category: 'Relaxing', difficulty: 'Hard', supplyCount: 1, emoji: '🌳', color: CATEGORY_COLORS.Relaxing },
  { id: 'l_spa', name: 'Spa', category: 'Relaxing', difficulty: 'Hard', supplyCount: 1, emoji: '🧖', color: CATEGORY_COLORS.Relaxing },
  // Nature
  { id: 'l_observatory', name: 'Observatory', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '🔭', color: CATEGORY_COLORS.Nature },
  { id: 'l_botanic', name: 'Botanic Garden', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '🌻', color: CATEGORY_COLORS.Nature },
  { id: 'l_flowers', name: 'Flower Shop', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '💐', color: CATEGORY_COLORS.Nature },
  { id: 'l_country', name: 'Country Club', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '⛳', color: CATEGORY_COLORS.Nature },
  { id: 'l_dogpark', name: 'Dog Park', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '🐕', color: CATEGORY_COLORS.Nature },
  // Services
  { id: 'l_post', name: 'Post Office', category: 'Services', difficulty: 'Easy', supplyCount: 1, emoji: '📮', color: CATEGORY_COLORS.Services },
  { id: 'l_airport', name: 'Airport', category: 'Services', difficulty: 'Easy', supplyCount: 1, emoji: '✈️', color: CATEGORY_COLORS.Services },
  { id: 'l_bank', name: 'Bank', category: 'Services', difficulty: 'Medium', supplyCount: 1, emoji: '💰', color: CATEGORY_COLORS.Services },
  { id: 'l_mall', name: 'Mall', category: 'Services', difficulty: 'Medium', supplyCount: 1, emoji: '🛍️', color: CATEGORY_COLORS.Services },
  { id: 'l_gym', name: 'Gym', category: 'Services', difficulty: 'Easy', supplyCount: 1, emoji: '🏋️', color: CATEGORY_COLORS.Services },
  { id: 'l_fire', name: 'Fire Department', category: 'Services', difficulty: 'Easy', supplyCount: 1, emoji: '🚒', color: CATEGORY_COLORS.Services },
];

interface PassengerReq {
  type: 'SPECIFIC' | 'CATEGORY';
  value: string; // landmark ID or Category Name
}

interface PassengerPersona {
  id: string;
  personaName: string;
  from: PassengerReq;
  to: PassengerReq;
}

// --- FULL PASSENGER LIST ---
const PASSENGER_PERSONAS: PassengerPersona[] = [
  // Specific -> Specific
  { id: 'p1', personaName: 'The Mystic', from: {type: 'SPECIFIC', value: 'l_fortune'}, to: {type: 'SPECIFIC', value: 'l_cemetery'} },
  { id: 'p2', personaName: 'The Tourist', from: {type: 'SPECIFIC', value: 'l_airport'}, to: {type: 'SPECIFIC', value: 'l_museum'} },
  { id: 'p3', personaName: 'Date Night', from: {type: 'SPECIFIC', value: 'l_restaurant'}, to: {type: 'SPECIFIC', value: 'l_theatre'} },
  { id: 'p4', personaName: 'Family Fun', from: {type: 'SPECIFIC', value: 'l_zoo'}, to: {type: 'SPECIFIC', value: 'l_theme'} },
  { id: 'p5', personaName: 'The Scholar', from: {type: 'SPECIFIC', value: 'l_library'}, to: {type: 'SPECIFIC', value: 'l_antique'} },
  
  // Category -> Specific (The Widow)
  { id: 'p_widow', personaName: 'The Widow', from: {type: 'CATEGORY', value: 'Relaxing'}, to: {type: 'SPECIFIC', value: 'l_cemetery'} },
  
  // Category -> Category (The Yoga Mom)
  { id: 'p_yoga', personaName: 'The Yoga Mom', from: {type: 'CATEGORY', value: 'Relaxing'}, to: {type: 'CATEGORY', value: 'Nature'} },
  
  // Mixed
  { id: 'p_foodie', personaName: 'The Food Critic', from: {type: 'SPECIFIC', value: 'l_airport'}, to: {type: 'CATEGORY', value: 'Foodie'} },
  { id: 'p_shopper', personaName: 'The Shopaholic', from: {type: 'CATEGORY', value: 'Services'}, to: {type: 'SPECIFIC', value: 'l_mall'} },
  { id: 'p_student', personaName: 'The Student', from: {type: 'SPECIFIC', value: 'l_library'}, to: {type: 'CATEGORY', value: 'Foodie'} },
  { id: 'p_fitness', personaName: 'Fitness Freak', from: {type: 'SPECIFIC', value: 'l_gym'}, to: {type: 'CATEGORY', value: 'Nature'} },
  { id: 'p_thrill', personaName: 'Adrenaline Junkie', from: {type: 'CATEGORY', value: 'Thrilling'}, to: {type: 'CATEGORY', value: 'Foodie'} },
  { id: 'p_culture', personaName: 'Culture Vulture', from: {type: 'CATEGORY', value: 'Cultural'}, to: {type: 'CATEGORY', value: 'Spiritual'} },
  { id: 'p_errands', personaName: 'Weekend Errands', from: {type: 'CATEGORY', value: 'Services'}, to: {type: 'CATEGORY', value: 'Foodie'} },
  { id: 'p_romantic', personaName: 'The Romantic', from: {type: 'CATEGORY', value: 'Nature'}, to: {type: 'SPECIFIC', value: 'l_rooftop'} },
];

/** --- TYPES --- */
type CardType = 'TRACK_STRAIGHT' | 'TRACK_CURVE' | 'LANDMARK';
interface HandCard { id: string; type: CardType; landmarkTypeId?: string; }
interface Point { x: number; y: number; }
interface Player {
  id: string; name: string; colorIdx: number; score: number;
  completedPassengers: string[]; hand: HandCard[]; lastAction?: string;
  hasTunnel: boolean; 
}
interface LandmarkInstance { instanceId: string; typeId: string; pos: Point; connectedColors: string[]; }
interface TrackSegment { id: string; from: Point; to: Point; playerId: string; isTunnel?: boolean; }
interface GameState {
  roomCode: string; status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Player[]; currentPlayerIndex: number; turnNumber: number;
  placedLandmarks: LandmarkInstance[]; placedSegments: TrackSegment[];
  landmarkDeck: string[]; passengerDeck: string[]; faceUpPassengers: string[];
  passengerDiscard: string[]; log: string[];
}

/** --- HELPERS --- */
const getManhattanDist = (p1: Point, p2: Point) => Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
const pointsEqual = (p1: Point, p2: Point) => p1.x === p2.x && p1.y === p2.y;
const isAdjacent = (p1: Point, p2: Point) => getManhattanDist(p1, p2) === 1;
const getSegmentId = (p1: Point, p2: Point) => {
  const s = [p1, p2].sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  return `${s[0].x},${s[0].y}-${s[1].x},${s[1].y}`;
};

const getPassengerPoints = (pId: string) => {
  const p = PASSENGER_PERSONAS.find(x => x.id === pId);
  if (!p) return 0;
  
  if (p.to.type === 'SPECIFIC') {
    const lType = LANDMARK_TYPES.find(l => l.id === p.to.value);
    return lType ? CONFIG.points[lType.difficulty] : 1;
  } else {
    const diff = CATEGORY_DIFFICULTY[p.to.value as Category];
    return CONFIG.points[diff];
  }
};

const drawLandmark = (deck: string[]) => {
  if (deck.length === 0) return { card: null, newDeck: [] };
  const newDeck = [...deck];
  const typeId = newDeck.shift()!;
  return { card: { id: Math.random().toString(36), type: 'LANDMARK' as const, landmarkTypeId: typeId }, newDeck };
};
const drawTrack = () => ({ id: Math.random().toString(36), type: Math.random() > 0.5 ? 'TRACK_STRAIGHT' as const : 'TRACK_CURVE' as const });

const generateInitialHand = (deckRef: string[]): { hand: HandCard[], newDeck: string[] } => {
  const hand: HandCard[] = [];
  let deck = [...deckRef];
  for (let i = 0; i < 3; i++) hand.push(drawTrack());
  for (let i = 0; i < 2; i++) {
    const res = drawLandmark(deck);
    if (res.card) hand.push(res.card);
    deck = res.newDeck;
  }
  return { hand, newDeck: deck };
};

/** --- GAME LOGIC --- */

const canPlaceLandmark = (state: GameState, pos: Point, playerId: string): { valid: boolean; reason?: string } => {
  if (state.placedLandmarks.some(l => pointsEqual(l.pos, pos))) return { valid: false, reason: 'Occupied' };
  
  const tooClose = state.placedLandmarks.some(l => {
    if (getManhattanDist(l.pos, pos) >= CONFIG.landmarkSpacing) return false;
    const isFloating = l.connectedColors.length === 0;
    const isConnectedToMe = l.connectedColors.includes(playerId);
    return isFloating || isConnectedToMe;
  });

  if (tooClose) return { valid: false, reason: 'Too close to unconnected or your landmark' };

  const mySegments = state.placedSegments.filter(s => s.playerId === playerId);
  const degreeMap = new Map<string, number>();
  mySegments.forEach(s => {
    const k1 = `${s.from.x},${s.from.y}`;
    const k2 = `${s.to.x},${s.to.y}`;
    degreeMap.set(k1, (degreeMap.get(k1) || 0) + 1);
    degreeMap.set(k2, (degreeMap.get(k2) || 0) + 1);
  });

  let validAnchors: Point[] = [];
  const ch = state.placedLandmarks.find(l => l.typeId === 'l_cityhall');
  if (ch) validAnchors.push(ch.pos); 

  degreeMap.forEach((deg, key) => {
    if (deg === 1) { 
      const [x, y] = key.split(',').map(Number);
      validAnchors.push({ x, y });
    }
  });

  const isWithinRange = validAnchors.some(anchor => getManhattanDist(anchor, pos) <= CONFIG.landmarkSpacing);
  if (!isWithinRange && mySegments.length > 0) {
    return { valid: false, reason: 'Must place near your tracks (Distance <= 3)' };
  }

  return { valid: true };
};

const canPlaceTrack = (state: GameState, from: Point, to: Point, playerId: string, cardType: 'TRACK_STRAIGHT' | 'TRACK_CURVE' | 'TUNNEL'): { valid: boolean; reason?: string } => {
  const dist = getManhattanDist(from, to);
  if (cardType === 'TUNNEL') {
    if (dist !== 2) return { valid: false, reason: 'Tunnel must jump 1 space (length 2)' };
    if (from.x !== to.x && from.y !== to.y) return { valid: false, reason: 'Tunnel must be straight' };
  } else {
    if (dist !== 1) return { valid: false, reason: 'Must be adjacent' };
  }

  const segId = getSegmentId(from, to);
  if (state.placedSegments.find(s => s.id === segId)) return { valid: false, reason: 'Track exists' };

  const isCityHall = (p: Point) => state.placedLandmarks.some(lm => pointsEqual(lm.pos, p) && lm.typeId === 'l_cityhall');
  const hasOwnTrackAt = (p: Point) => state.placedSegments.some(s => s.playerId === playerId && (pointsEqual(s.from, p) || pointsEqual(s.to, p)));

  if (!isCityHall(from) && !hasOwnTrackAt(from) && !isCityHall(to) && !hasOwnTrackAt(to)) {
    return { valid: false, reason: 'Must connect to your track' };
  }

  const fromHasMyTrack = state.placedSegments.some(s => s.playerId === playerId && (pointsEqual(s.from, from) || pointsEqual(s.to, from)));
  const toHasMyTrack = state.placedSegments.some(s => s.playerId === playerId && (pointsEqual(s.from, to) || pointsEqual(s.to, to)));
  if (fromHasMyTrack && toHasMyTrack && !isCityHall(from) && !isCityHall(to)) {
     return { valid: false, reason: "Cannot merge/loop own tracks" };
  }

  const getMyDegree = (p: Point) => state.placedSegments.filter(s => s.playerId === playerId && (pointsEqual(s.from, p) || pointsEqual(s.to, p))).length;
  if (!isCityHall(from) && getMyDegree(from) >= 2) return { valid: false, reason: "No branching allowed" };
  if (!isCityHall(to) && getMyDegree(to) >= 2) return { valid: false, reason: "No branching allowed" };

  const anchor = hasOwnTrackAt(from) || isCityHall(from) ? from : to;
  const target = anchor === from ? to : from;
  const mySegs = state.placedSegments.filter(s => s.playerId === playerId && (pointsEqual(s.from, anchor) || pointsEqual(s.to, anchor)));
  
  if (mySegs.length > 0 && cardType !== 'TUNNEL') {
    const validGeo = mySegs.some(prev => {
      const prevEnd = pointsEqual(prev.from, anchor) ? prev.to : prev.from;
      const dx1 = anchor.x - prevEnd.x;
      const dy1 = anchor.y - prevEnd.y;
      const dx2 = target.x - anchor.x;
      const dy2 = target.y - anchor.y;
      const isStraight = (dx1 === dx2 && dy1 === dy2);
      if (cardType === 'TRACK_STRAIGHT') return isStraight;
      if (cardType === 'TRACK_CURVE') return !isStraight;
      return false;
    });
    if (!validGeo) return { valid: false, reason: `Wrong card type for this turn` };
  }

  return { valid: true };
};

const checkConnection = (state: GameState, playerId: string, passenger: PassengerPersona): boolean => {
  const placedFrom = state.placedLandmarks.filter(l => {
    const type = LANDMARK_TYPES.find(t => t.id === l.typeId);
    if (!type) return false;
    if (passenger.from.type === 'SPECIFIC') return type.id === passenger.from.value;
    if (passenger.from.type === 'CATEGORY') return type.category === passenger.from.value;
    return false;
  });

  const placedTo = state.placedLandmarks.filter(l => {
    const type = LANDMARK_TYPES.find(t => t.id === l.typeId);
    if (!type) return false;
    if (passenger.to.type === 'SPECIFIC') return type.id === passenger.to.value;
    if (passenger.to.type === 'CATEGORY') return type.category === passenger.to.value;
    return false;
  });

  if (placedFrom.length === 0 || placedTo.length === 0) return false;

  const adj = new Map<string, string[]>();
  state.placedSegments.filter(s => s.playerId === playerId).forEach(s => {
    const k1 = `${s.from.x},${s.from.y}`;
    const k2 = `${s.to.x},${s.to.y}`;
    if (!adj.has(k1)) adj.set(k1, []);
    if (!adj.has(k2)) adj.set(k2, []);
    adj.get(k1)!.push(k2);
    adj.get(k2)!.push(k1);
  });

  const targets = new Set(placedTo.map(l => `${l.pos.x},${l.pos.y}`));
  
  for (const startLm of placedFrom) {
    const startKey = `${startLm.pos.x},${startLm.pos.y}`;
    if (!adj.has(startKey)) continue;

    const queue = [startKey];
    const visited = new Set<string>([startKey]);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (targets.has(curr)) return true;

      const neighbors = adj.get(curr) || [];
      for (const n of neighbors) {
        if (!visited.has(n)) {
          visited.add(n);
          queue.push(n);
        }
      }
    }
  }
  return false;
};

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <h1>Something went wrong.</h1>;
    }

    return this.props.children;
  }
}

/** --- APP COMPONENT --- */
export default function App() {
  return (
    <ErrorBoundary>
      <Game />
    </ErrorBoundary>
  );
}

function Game() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOBBY' | 'GAME'>('LOBBY');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  
  // UI State
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [selectedNode, setSelectedNode] = useState<Point | null>(null);
  const [showTunnelMode, setShowTunnelMode] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toast, setToast] = useState<{msg:string, type:'error'|'success'} | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverLandmark, setHoverLandmark] = useState<{ name: string, cat: string, x: number, y: number } | null>(null);
  const [hoverNode, setHoverNode] = useState<Point | null>(null);

  useEffect(() => { signInAnonymously(auth); return onAuthStateChanged(auth, setUser); }, []);

  useEffect(() => {
    if (!localStorage.getItem('mtg_intro_seen')) {
      setShowOnboarding(true);
      localStorage.setItem('mtg_intro_seen', 'true');
    }
  }, []);

  useEffect(() => {
    if (!user || !roomCode || view !== 'GAME') return;
    const unsub = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomCode), (snap) => {
      if (snap.exists()) setGameState(snap.data() as GameState);
      else setView('LOBBY');
    });
    return () => unsub();
  }, [user, roomCode, view]);

  const createRoom = async () => {
    if (!user || !playerName) return;
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code), {
      roomCode: code, status: 'WAITING',
      players: [{ id: user.uid, name: playerName, colorIdx: 0, score: 0, segmentsPlaced: 0, completedPassengers: [], hand: [], hasTunnel: true, lastAction: 'Host' }],
      currentPlayerIndex: 0, turnNumber: 1, placedLandmarks: [], placedSegments: [],
      landmarkDeck: [], passengerDeck: [], faceUpPassengers: [], passengerDiscard: [], log: ['Room created.']
    });
    setRoomCode(code); setView('GAME');
  };

  const joinRoom = async () => {
    if (!user || !playerName || !roomCode) return;
    const code = roomCode.toUpperCase();
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code);
    const snap = await getDoc(ref);
    if (!snap.exists()) { setError('Room not found'); return; }
    
    const data = snap.data() as GameState;
    if (!data.players.some(p => p.id === user.uid)) {
      if (data.status !== 'WAITING') { setError('Game started'); return; }
      if (data.players.length >= 4) { setError('Room full'); return; }
      
      const newPlayer = { id: user.uid, name: playerName, colorIdx: data.players.length, score: 0, segmentsPlaced: 0, completedPassengers: [], hand: [], hasTunnel: true, lastAction: 'Joined' };
      await updateDoc(ref, { players: [...data.players, newPlayer] });
    }
    setRoomCode(code); setView('GAME');
  };

  const startGame = async () => {
    let lDeck: string[] = [];
    LANDMARK_TYPES.forEach(l => { if(l.id!=='l_cityhall') lDeck.push(l.id); });
    lDeck.sort(() => Math.random() - 0.5);
    const pDeck = PASSENGER_PERSONAS.map(p=>p.id).sort(() => Math.random() - 0.5);
    const faceUp = pDeck.splice(0, 3);
    
    const players = [...gameState!.players];
    players.forEach(p => {
      p.hand = [];
      for(let i=0; i<3; i++) p.hand.push({id: Math.random().toString(), type: Math.random()>0.5 ? 'TRACK_STRAIGHT':'TRACK_CURVE'});
      for(let i=0; i<2; i++) {
        const t = lDeck.shift();
        if(t) p.hand.push({id: Math.random().toString(), type: 'LANDMARK', landmarkTypeId: t});
      }
    });

    const center = { x: Math.floor(CONFIG.gridSize/2), y: Math.floor(CONFIG.gridSize/2) };
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', gameState!.roomCode), {
      status: 'PLAYING', landmarkDeck: lDeck, passengerDeck: pDeck, faceUpPassengers: faceUp,
      placedLandmarks: [{ instanceId: 'city', typeId: 'l_cityhall', pos: center, connectedColors: [] }],
      players
    });
  };

  const submitMove = async (newState: GameState, desc: string, cardIdx?: number) => {
    const s = {...newState};
    const p = s.players[s.currentPlayerIndex];
    p.lastAction = desc;

    if (cardIdx !== undefined) {
      const type = p.hand[cardIdx].type;
      p.hand.splice(cardIdx, 1);
      if (type === 'LANDMARK') {
        const res = drawLandmark(s.landmarkDeck);
        if(res.card) { p.hand.push(res.card); s.landmarkDeck = res.newDeck; }
      } else {
        p.hand.push(drawTrack());
      }
    }

    const claimed: string[] = [];
    const keptFaceUp: string[] = [];
    for (const pid of s.faceUpPassengers) {
      const passenger = PASSENGER_PERSONAS.find(x => x.id === pid)!;
      if (checkConnection(s, p.id, passenger)) {
        claimed.push(pid);
        p.score += getPassengerPoints(pid);
        p.completedPassengers.push(pid);
        s.passengerDiscard.push(pid);
      } else {
        keptFaceUp.push(pid);
      }
    }

    if (claimed.length > 0) {
      s.log = [`${p.name} completed ${claimed.length} passengers!`, ...s.log];
      s.faceUpPassengers = keptFaceUp;
      while (s.faceUpPassengers.length < 3 && s.passengerDeck.length > 0) {
        s.faceUpPassengers.push(s.passengerDeck.shift()!);
      }
    }

    if (p.score >= CONFIG.winScore) s.status = 'FINISHED';
    else {
      s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length;
      s.turnNumber++;
    }
    
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', s.roomCode), s);
    setSelectedCardIdx(null); setSelectedNode(null); setShowTunnelMode(false);
  };

  const recycleHand = async () => {
    if (!gameState) return;
    const s = { ...gameState };
    const p = s.players[s.currentPlayerIndex];
    
    p.hand = [];
    for(let i=0; i<3; i++) p.hand.push({id: Math.random().toString(), type: Math.random()>0.5 ? 'TRACK_STRAIGHT':'TRACK_CURVE'});
    for(let i=0; i<2; i++) {
        const res = drawLandmark(s.landmarkDeck);
        if(res.card) { p.hand.push(res.card); s.landmarkDeck = res.newDeck; }
    }
    
    s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length;
    s.log.unshift(`${p.name} swapped hand`);
    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', s.roomCode), s);
  };

  const handleNodeClick = (x: number, y: number) => {
    if (!gameState || gameState.status !== 'PLAYING') return;
    const p = gameState.players[gameState.currentPlayerIndex];
    if (p.id !== user?.uid) return;

    if (showTunnelMode) {
      if (!selectedNode) {
        setSelectedNode({x,y}); 
      } else {
        const res = canPlaceTrack(gameState, selectedNode, {x,y}, p.id, 'TUNNEL');
        if (!res.valid) { setToast({msg: res.reason || 'Invalid', type: 'error'}); setTimeout(()=>setToast(null), 3000); return; }
        
        const newState = { ...gameState };
        newState.placedSegments.push({
            id: getSegmentId(selectedNode, {x,y}),
            from: selectedNode,
            to: {x,y},
            playerId: p.id,
            isTunnel: true
        });
        const me = newState.players.find(pl => pl.id === p.id);
        if(me) me.hasTunnel = false;
        
        submitMove(newState, 'dug a tunnel');
      }
      return;
    }

    if (selectedCardIdx === null) return;
    const clicked = { x, y };
    const card = p.hand[selectedCardIdx];

    if (card.type === 'LANDMARK' && card.landmarkTypeId) {
      const res = canPlaceLandmark(gameState, clicked, p.id);
      if (!res.valid) { setToast({msg: res.reason || 'Invalid', type: 'error'}); setTimeout(()=>setToast(null), 3000); return; }
      
      const newState = { ...gameState };
      const newLandmark: LandmarkInstance = {
        instanceId: `lm_${Date.now()}_${Math.random()}`,
        typeId: card.landmarkTypeId,
        pos: clicked,
        connectedColors: []
      };
      if (gameState.placedSegments.some(s => s.playerId === p.id && (pointsEqual(s.from, clicked) || pointsEqual(s.to, clicked)))) {
         newLandmark.connectedColors.push(p.id);
      }
      newState.placedLandmarks.push(newLandmark);
      submitMove(newState, `placed ${LANDMARK_TYPES.find(l => l.id === card.landmarkTypeId)?.name}`, selectedCardIdx);
      return;
    }

    if (card.type.startsWith('TRACK')) {
      if (selectedNode) {
        if (pointsEqual(selectedNode, clicked)) {
          setSelectedNode(null);
        } else if (isAdjacent(selectedNode, clicked)) {
          const res = canPlaceTrack(gameState, selectedNode, clicked, p.id, card.type as any);
          if (!res.valid) { setToast({msg: res.reason || 'Invalid', type: 'error'}); setTimeout(()=>setToast(null), 3000); return; }

          const newState = { ...gameState };
          const pIdx = newState.currentPlayerIndex;
          newState.players[pIdx].segmentsPlaced++;
          newState.placedSegments.push({
            id: getSegmentId(selectedNode, clicked),
            from: selectedNode,
            to: clicked,
            playerId: p.id
          });
          submitMove(newState, 'built track', selectedCardIdx);
        } else {
          setSelectedNode(clicked);
        }
      } else {
        setSelectedNode(clicked);
      }
    }
  };

  const handleCardClick = (idx: number) => {
    if (!gameState || gameState.status !== 'PLAYING') return;
    const p = gameState.players[gameState.currentPlayerIndex];
    if (p.id !== user?.uid) return;

    setSelectedCardIdx(idx === selectedCardIdx ? null : idx);
    setSelectedNode(null);
  };

  if (view === 'LOBBY') {
    return (
      <div className="flex h-screen bg-slate-800 items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-2xl max-w-md w-full">
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-2">
            <Activity className="text-blue-600" /> Mind the Gap
          </h1>
          <p className="text-slate-500 mb-6">Multiplayer Edition</p>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-1">Your Name</label>
              <input className="w-full p-2 border rounded" placeholder="Enter name" value={playerName} onChange={e => setPlayerName(e.target.value)} />
            </div>
            <div className="pt-4 border-t flex flex-col gap-3">
              <button onClick={createRoom} disabled={!playerName} className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50">Create New Room</button>
              <div className="flex gap-2">
                <input className="flex-1 p-2 border rounded uppercase" placeholder="Room Code" value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={4} />
                <button onClick={joinRoom} disabled={!playerName || roomCode.length !== 4} className="px-6 py-2 bg-slate-200 font-bold rounded hover:bg-slate-300 disabled:opacity-50">Join</button>
              </div>
            </div>
            {error && <div className="text-red-500 text-sm text-center font-bold">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (!gameState) return <div className="h-screen flex items-center justify-center">Loading Game...</div>;

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const myTurn = currentPlayer.id === user?.uid;
  const me = gameState.players.find(p => p.id === user?.uid);

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-[#f5f5f4] font-sans text-slate-800">
      {showOnboarding && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Activity className="text-blue-600"/> How to Play</h2>
            <ul className="space-y-3 text-sm text-slate-600 mb-6">
              <li className="flex gap-2"><Check size={16} className="text-green-600 flex-shrink-0"/> Build track from City Hall to Landmarks to score.</li>
              <li className="flex gap-2"><Check size={16} className="text-green-600 flex-shrink-0"/> <b>Straight</b> cards must go straight. <b>Curve</b> cards must turn.</li>
              <li className="flex gap-2"><Check size={16} className="text-green-600 flex-shrink-0"/> Place Landmarks 3 spaces away from your existing stops.</li>
              <li className="flex gap-2"><Check size={16} className="text-green-600 flex-shrink-0"/> Use your <b>Tunnel Token</b> once to jump over an opponent!</li>
            </ul>
            <button onClick={() => setShowOnboarding(false)} className="w-full py-3 bg-slate-900 text-white rounded-lg font-bold">Let's Go</button>
          </div>
        </div>
      )}

      {hoverLandmark && (
        <div className="fixed z-50 px-3 py-1 bg-slate-800 text-white text-xs rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full whitespace-nowrap" style={{ left: hoverLandmark.x, top: hoverLandmark.y }}>
          <div className="font-bold">{hoverLandmark.name}</div>
          <div className="text-slate-300 text-[10px]">{hoverLandmark.cat}</div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white font-bold transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      <div className="flex-1 relative bg-slate-200 overflow-auto flex items-center justify-center p-8">
        <div className="relative bg-white shadow-xl border-4 border-slate-300 flex-none" style={{ width: CONFIG.gridSize * 40, height: CONFIG.gridSize * 40 }}>
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {gameState.placedSegments.map(seg => {
              const x1 = seg.from.x * 40 + 20;
              const y1 = seg.from.y * 40 + 20;
              const x2 = seg.to.x * 40 + 20;
              const y2 = seg.to.y * 40 + 20;
              const p = gameState.players.find(pl => pl.id === seg.playerId);
              const color = p ? CONFIG.colors[p.colorIdx].hex : '#999';
              return (
                <g key={seg.id}>
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="12" strokeLinecap="round" />
                  <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="white" strokeWidth="4" strokeLinecap="round" strokeDasharray={seg.isTunnel ? "4,4" : ""} opacity={0.3} />
                </g>
              );
            })}
            {myTurn && selectedNode && selectedCardIdx !== null && me?.hand[selectedCardIdx].type.startsWith('TRACK') && (
              <>
                {[{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}].map((d, i) => {
                  const target = { x: selectedNode.x + d.x, y: selectedNode.y + d.y };
                  if (target.x < 0 || target.x >= CONFIG.gridSize || target.y < 0 || target.y >= CONFIG.gridSize) return null;
                  const res = canPlaceTrack(gameState, selectedNode, target, me.id, me.hand[selectedCardIdx].type as any);
                  if (res.valid) return <circle key={i} cx={target.x * 40 + 20} cy={target.y * 40 + 20} r="6" className="fill-blue-400 animate-pulse opacity-50" />;
                  return null;
                })}
              </>
            )}
            {myTurn && selectedCardIdx !== null && me?.hand[selectedCardIdx].type === 'LANDMARK' && hoverNode && (
               canPlaceLandmark(gameState, hoverNode, me.id).valid ? (
                 <rect x={hoverNode.x * 40 + 2} y={hoverNode.y * 40 + 2} width="36" height="36" className="fill-green-400 opacity-40" />
               ) : (
                 <rect x={hoverNode.x * 40 + 2} y={hoverNode.y * 40 + 2} width="36" height="36" className="fill-red-400 opacity-40" />
               )
            )}
          </svg>
          <div className="absolute inset-0 grid z-20" style={{ gridTemplateColumns: `repeat(${CONFIG.gridSize}, 1fr)` }} onMouseLeave={() => setHoverNode(null)}>
            {Array.from({ length: CONFIG.gridSize * CONFIG.gridSize }).map((_, i) => {
              const x = i % CONFIG.gridSize;
              const y = Math.floor(i / CONFIG.gridSize);
              const lm = gameState.placedLandmarks.find(l => l.pos.x === x && l.pos.y === y);
              const lmType = lm ? LANDMARK_TYPES.find(t => t.id === lm.typeId) : null;
              return (
                <div 
                  key={i} 
                  onClick={() => handleNodeClick(x, y)}
                  onMouseEnter={() => setHoverNode({x, y})}
                  className={`relative flex items-center justify-center transition-all ${selectedNode?.x===x && selectedNode?.y===y ? 'bg-blue-100/50' : ''}`}
                >
                  {lmType && (
                    <div 
                      className="text-2xl transform hover:scale-125 transition-transform cursor-pointer" 
                      onMouseEnter={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setHoverLandmark({ name: lmType.name, cat: lmType.category, x: rect.left + rect.width/2, y: rect.top - 10 });
                      }}
                      onMouseLeave={() => setHoverLandmark(null)}
                    >
                      {lmType.emoji}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="md:hidden h-14 bg-white border-b flex items-center justify-between px-4 z-20">
        <span className="font-bold flex items-center gap-2"><Activity size={18}/> {gameState.roomCode}</span>
        <div className="flex gap-2">
          <button onClick={() => setMenuOpen(true)} className="p-2 bg-slate-100 rounded-full"><Menu size={18}/></button>
        </div>
      </div>

      <div className="h-40 bg-white border-t p-3 flex flex-col gap-2 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-30">
         <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold uppercase text-slate-400">Your Hand</span>
            <div className="flex gap-2">
               {me?.hasTunnel && (
                 <button onClick={() => setShowTunnelMode(!showTunnelMode)} className={`px-3 py-1 text-xs font-bold rounded-full border transition-colors ${showTunnelMode ? 'bg-black text-white border-black' : 'bg-white text-slate-600 border-slate-300'}`}>🚇 Tunnel</button>
               )}
               <button onClick={recycleHand} className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center gap-1"><RotateCcw size={10}/> Swap</button>
            </div>
         </div>
         <div className="flex gap-2 h-full overflow-x-auto pb-1">
            {me?.hand.map((card, idx) => {
               const lm = card.type === 'LANDMARK' ? LANDMARK_TYPES.find(l => l.id === card.landmarkTypeId) : null;
               const isSelected = selectedCardIdx === idx;
               return (
                 <button
                   key={card.id}
                   onClick={() => { setSelectedCardIdx(isSelected ? null : idx); setSelectedNode(null); }}
                   disabled={!myTurn}
                   className={`
                     ticket-card min-w-[80px] w-24 relative flex flex-col items-center justify-between p-2
                     transition-all-300 border-b-4 
                     ${isSelected ? 'transform -translate-y-2 shadow-lg border-blue-600 bg-blue-50' : 'bg-white border-slate-300 hover:bg-slate-50'}
                     ${!myTurn ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                   `}
                 >
                    {card.type === 'LANDMARK' ? (
                      <>
                        <div className={`w-full text-[9px] font-bold text-white px-1 py-0.5 rounded-t text-center ${lm?.color || 'bg-gray-500'}`}>{lm?.category.toUpperCase()}</div>
                        <div className="text-3xl my-1">{lm?.emoji}</div>
                        <div className="text-[10px] font-bold leading-tight text-center truncate w-full">{lm?.name}</div>
                      </>
                    ) : (
                      <>
                        <div className="w-full text-[9px] font-bold text-slate-400 text-center uppercase">Transit</div>
                        <div className="text-slate-700">{card.type === 'TRACK_STRAIGHT' ? <ArrowUp size={28}/> : <CornerUpRight size={28}/>}</div>
                        <div className="text-[10px] font-bold">{card.type === 'TRACK_STRAIGHT' ? 'STRAIGHT' : 'CURVE'}</div>
                      </>
                    )}
                 </button>
               )
            })}
         </div>
      </div>

      <div className={`fixed inset-y-0 right-0 w-80 bg-white shadow-2xl transform transition-transform duration-300 z-40 ${menuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:static md:w-80 md:shadow-none md:border-l'}`}>
         <div className="p-4 border-b flex justify-between items-center bg-slate-50">
            <h2 className="font-bold text-lg">Station Info</h2>
            <button onClick={() => setMenuOpen(false)} className="md:hidden"><X/></button>
         </div>
         <div className="p-4 space-y-6">
            <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Passengers Waiting</h3>
               <div className="space-y-2">
                  {gameState.faceUpPassengers.map(pid => {
                    const p = PASSENGER_PERSONAS.find(x => x.id === pid)!;
                    
                    const fromLabel = p.from.type === 'SPECIFIC' 
                      ? LANDMARK_TYPES.find(l => l.id === p.from.value)?.emoji 
                      : <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border font-bold">{p.from.value}</span>;
                    
                    const toLabel = p.to.type === 'SPECIFIC'
                      ? LANDMARK_TYPES.find(l => l.id === p.to.value)?.emoji
                      : <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-100 border font-bold">{p.to.value}</span>;

                    return (
                      <div key={pid} className="bg-white border rounded p-2 shadow-sm flex flex-col gap-1">
                         <div className="font-bold text-sm">{p.personaName}</div>
                         <div className="flex items-center gap-2 text-xs text-slate-600">
                            {fromLabel} <ArrowUp size={10} className="rotate-90"/> {toLabel}
                         </div>
                      </div>
                    )
                  })}
               </div>
            </div>
            <div>
               <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Lines</h3>
               {gameState.players.map(p => (
                 <div key={p.id} className="flex justify-between items-center text-sm py-1">
                    <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${CONFIG.colors[p.colorIdx].tailwind}`}/> <span className={p.id === currentPlayer.id ? 'font-bold' : ''}>{p.name}</span></div>
                    <span className="font-mono font-bold">{p.score} pts</span>
                 </div>
               ))}
            </div>
         </div>
      </div>

      {gameState.status === 'FINISHED' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 animate-pop-in">
          <div className="bg-white rounded-xl p-8 text-center shadow-2xl border-4 border-yellow-400">
            <Trophy size={64} className="mx-auto text-yellow-500 mb-4" />
            <h1 className="text-4xl font-black mb-2 text-slate-900">WINNER!</h1>
            <p className="text-xl text-slate-600 mb-6">{gameState.players.sort((a,b)=>b.score-a.score)[0].name} takes the crown!</p>
            <button onClick={() => setView('LOBBY')} className="px-8 py-3 bg-blue-600 text-white font-bold rounded-full">Back to Station</button>
          </div>
        </div>
      )}
    </div>
  );
}
