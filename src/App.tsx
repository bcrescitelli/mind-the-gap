import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Trophy, Activity, Users, ArrowUp, CornerUpRight, FastForward, MapPin, AlertCircle, Copy, Check } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, onSnapshot, arrayUnion, collection } from 'firebase/firestore';

/**
 * ============================================================================
 * FIREBASE SETUP
 * ============================================================================
 */

// Your web app's Firebase configuration
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
// @ts-ignore
const appId = typeof __app_id !== 'undefined' ? __app_id : 'mind-the-gap';

/**
 * ============================================================================
 * CONFIGURATION & DATA
 * ============================================================================
 */

const CONFIG = {
  gridSize: 20,
  winScore: 20,
  landmarkSpacing: 3, // Changed from 4 to 3 per request
  maxSegmentsPerLandmarkPerPlayer: 2, 
  maxColorsPerLandmark: 2, 
  handSize: 5,
  points: { Easy: 1, Medium: 2, Hard: 3, Rare: 4 },
  colors: [
    { name: 'Red', hex: '#ef4444', tailwind: 'bg-red-500', ring: 'ring-red-500' },
    { name: 'Blue', hex: '#3b82f6', tailwind: 'bg-blue-500', ring: 'ring-blue-500' },
    { name: 'Green', hex: '#22c55e', tailwind: 'bg-green-500', ring: 'ring-green-500' },
    { name: 'Yellow', hex: '#eab308', tailwind: 'bg-yellow-500', ring: 'ring-yellow-500' },
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
}

const LANDMARK_TYPES: LandmarkType[] = [
  { id: 'l_cityhall', name: 'City Hall', category: 'Special', difficulty: 'Easy', supplyCount: 1, emoji: '🏛️' },
  { id: 'l_fortune', name: 'Fortune Teller', category: 'Spiritual', difficulty: 'Rare', supplyCount: 1, emoji: '🔮' },
  { id: 'l_cemetery', name: 'Cemetery', category: 'Spiritual', difficulty: 'Rare', supplyCount: 1, emoji: '🪦' },
  { id: 'l_antique', name: 'Antique Store', category: 'Spiritual', difficulty: 'Rare', supplyCount: 1, emoji: '🏺' },
  { id: 'l_theme', name: 'Theme Park', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🎢' },
  { id: 'l_zoo', name: 'Zoo', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🦁' },
  { id: 'l_stadium', name: 'Stadium', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🏟️' },
  { id: 'l_arcade', name: 'Arcade', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🕹️' },
  { id: 'l_tattoo', name: 'Tattoo Parlor', category: 'Thrilling', difficulty: 'Medium', supplyCount: 1, emoji: '🐉' },
  { id: 'l_museum', name: 'Museum', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '🏛️' },
  { id: 'l_theatre', name: 'Theatre', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '🎭' },
  { id: 'l_cinema', name: 'Cinema', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '🍿' },
  { id: 'l_clock', name: 'Clock Tower', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '🕰️' },
  { id: 'l_library', name: 'Library', category: 'Cultural', difficulty: 'Medium', supplyCount: 1, emoji: '📚' },
  { id: 'l_restaurant', name: 'Restaurant', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🍽️' },
  { id: 'l_deli', name: 'Deli', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🥪' },
  { id: 'l_sweet', name: 'Sweet Shop', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🍬' },
  { id: 'l_farmers', name: 'Farmers Market', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🥦' },
  { id: 'l_cafe', name: 'Cafe', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '☕' },
  { id: 'l_rooftop', name: 'Rooftop Bar', category: 'Foodie', difficulty: 'Easy', supplyCount: 1, emoji: '🍸' },
  { id: 'l_pier', name: 'Pier', category: 'Relaxing', difficulty: 'Hard', supplyCount: 1, emoji: '🎡' },
  { id: 'l_salon', name: 'Salon', category: 'Relaxing', difficulty: 'Hard', supplyCount: 1, emoji: '💇' },
  { id: 'l_park', name: 'Park', category: 'Relaxing', difficulty: 'Hard', supplyCount: 1, emoji: '🌳' },
  { id: 'l_spa', name: 'Spa', category: 'Relaxing', difficulty: 'Hard', supplyCount: 1, emoji: '🧖' },
  { id: 'l_observatory', name: 'Observatory', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '🔭' },
  { id: 'l_botanic', name: 'Botanic Garden', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '🌻' },
  { id: 'l_flowers', name: 'Flower Shop', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '💐' },
  { id: 'l_country', name: 'Country Club', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '⛳' },
  { id: 'l_dogpark', name: 'Dog Park', category: 'Nature', difficulty: 'Medium', supplyCount: 1, emoji: '🐕' },
  { id: 'l_post', name: 'Post Office', category: 'Services', difficulty: 'Easy', supplyCount: 1, emoji: '📮' },
  { id: 'l_airport', name: 'Airport', category: 'Services', difficulty: 'Easy', supplyCount: 1, emoji: '✈️' },
  { id: 'l_bank', name: 'Bank', category: 'Services', difficulty: 'Medium', supplyCount: 1, emoji: '💰' },
  { id: 'l_mall', name: 'Mall', category: 'Services', difficulty: 'Medium', supplyCount: 1, emoji: '🛍️' },
  { id: 'l_gym', name: 'Gym', category: 'Services', difficulty: 'Easy', supplyCount: 1, emoji: '🏋️' },
  { id: 'l_fire', name: 'Fire Department', category: 'Services', difficulty: 'Easy', supplyCount: 1, emoji: '🚒' },
];

interface PassengerPersona {
  id: string;
  personaName: string;
  fromTypeId: string;
  toTypeId: string;
}

const PASSENGER_PERSONAS: PassengerPersona[] = [
  { id: 'p1', personaName: 'The Midnight Mystic', fromTypeId: 'l_fortune', toTypeId: 'l_cemetery' },
  { id: 'p2', personaName: 'The Candlelighter', fromTypeId: 'l_cemetery', toTypeId: 'l_fortune' },
  { id: 'p3', personaName: 'The Antique Hunter', fromTypeId: 'l_antique', toTypeId: 'l_museum' },
  { id: 'p4', personaName: 'The Adrenaline Kid', fromTypeId: 'l_arcade', toTypeId: 'l_theme' },
  { id: 'p5', personaName: 'The Animal Lover', fromTypeId: 'l_cafe', toTypeId: 'l_zoo' },
  { id: 'p6', personaName: 'The Big Game Fan', fromTypeId: 'l_deli', toTypeId: 'l_stadium' },
  { id: 'p7', personaName: 'The Ink Tourist', fromTypeId: 'l_sweet', toTypeId: 'l_tattoo' },
  { id: 'p8', personaName: 'The Culture Hopper', fromTypeId: 'l_theatre', toTypeId: 'l_cinema' },
  { id: 'p9', personaName: 'The History Buff', fromTypeId: 'l_library', toTypeId: 'l_museum' },
  { id: 'p10', personaName: 'The Clock Chaser', fromTypeId: 'l_park', toTypeId: 'l_clock' },
  { id: 'p11', personaName: 'The Date Night Duo', fromTypeId: 'l_rooftop', toTypeId: 'l_cinema' },
  { id: 'p12', personaName: 'The Sunday Stroller', fromTypeId: 'l_farmers', toTypeId: 'l_park' },
  { id: 'p13', personaName: 'The Spa Day Planner', fromTypeId: 'l_mall', toTypeId: 'l_spa' },
  { id: 'p14', personaName: 'The Skywatcher', fromTypeId: 'l_restaurant', toTypeId: 'l_observatory' },
  { id: 'p15', personaName: 'The Plant Parent', fromTypeId: 'l_flowers', toTypeId: 'l_botanic' },
  { id: 'p16', personaName: 'The Country Clubber', fromTypeId: 'l_bank', toTypeId: 'l_country' },
  { id: 'p17', personaName: 'The Dog Walker', fromTypeId: 'l_dogpark', toTypeId: 'l_pier' },
  { id: 'p18', personaName: 'The Jet Setter', fromTypeId: 'l_airport', toTypeId: 'l_rooftop' },
  { id: 'p19', personaName: 'The Bookworm', fromTypeId: 'l_post', toTypeId: 'l_library' },
  { id: 'p20', personaName: 'The First Responder', fromTypeId: 'l_fire', toTypeId: 'l_gym' },
  { id: 'p21', personaName: 'The Wellness Regular', fromTypeId: 'l_gym', toTypeId: 'l_salon' },
  { id: 'p22', personaName: 'The Picnic Crew', fromTypeId: 'l_cafe', toTypeId: 'l_park' },
  { id: 'p23', personaName: 'The Art Student', fromTypeId: 'l_museum', toTypeId: 'l_theatre' },
  { id: 'p24', personaName: 'The Night Owl', fromTypeId: 'l_arcade', toTypeId: 'l_rooftop' },
  { id: 'p25', personaName: 'The Family Outing', fromTypeId: 'l_zoo', toTypeId: 'l_farmers' },
  { id: 'p26', personaName: 'The Roller Coaster Vet', fromTypeId: 'l_theme', toTypeId: 'l_stadium' },
  { id: 'p27', personaName: 'The Quiet Thinker', fromTypeId: 'l_library', toTypeId: 'l_observatory' },
  { id: 'p28', personaName: 'The Self Care Guru', fromTypeId: 'l_salon', toTypeId: 'l_spa' },
  { id: 'p29', personaName: 'The Sunset Seeker', fromTypeId: 'l_pier', toTypeId: 'l_cinema' },
  { id: 'p30', personaName: 'The Mall Rat', fromTypeId: 'l_mall', toTypeId: 'l_sweet' },
];

/**
 * ============================================================================
 * TYPES
 * ============================================================================
 */

type CardType = 'TRACK_STRAIGHT' | 'TRACK_CURVE' | 'LANDMARK';

interface HandCard {
  id: string;
  type: CardType;
  landmarkTypeId?: string;
}

interface Point { x: number; y: number; }
interface Player {
  id: string; // Auth UID
  name: string;
  colorIdx: number;
  score: number;
  segmentsPlaced: number;
  completedPassengers: string[];
  hand: HandCard[];
  lastAction?: string;
}

interface LandmarkInstance {
  instanceId: string;
  typeId: string;
  pos: Point;
  connectedColors: string[]; // Player IDs
}

interface TrackSegment {
  id: string;
  from: Point;
  to: Point;
  playerId: string; // Player ID
}

interface GameState {
  roomCode: string;
  status: 'WAITING' | 'PLAYING' | 'FINISHED';
  players: Player[];
  currentPlayerIndex: number;
  turnNumber: number;
  placedLandmarks: LandmarkInstance[];
  placedSegments: TrackSegment[];
  landmarkDeck: string[]; 
  passengerDeck: string[]; 
  faceUpPassengers: string[];
  passengerDiscard: string[];
  log: string[];
}

// --- HELPERS ---

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
  const lType = LANDMARK_TYPES.find(l => l.id === p.toTypeId);
  return lType ? CONFIG.points[lType.difficulty] : 0;
};

const drawLandmark = (landmarkDeck: string[]): { card: HandCard | null, newDeck: string[] } => {
  if (landmarkDeck.length === 0) return { card: null, newDeck: [] };
  const newDeck = [...landmarkDeck];
  const typeId = newDeck.shift()!;
  const card: HandCard = { id: Math.random().toString(36), type: 'LANDMARK', landmarkTypeId: typeId };
  return { card, newDeck };
};

const drawTrack = (): HandCard => {
  return { id: Math.random().toString(36), type: Math.random() > 0.5 ? 'TRACK_STRAIGHT' : 'TRACK_CURVE' };
};

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

/**
 * ============================================================================
 * GAME ENGINE (Pure Functions)
 * ============================================================================
 */

const canPlaceLandmark = (state: GameState, pos: Point, playerId: string): { valid: boolean; reason?: string } => {
  if (state.placedLandmarks.some(l => pointsEqual(l.pos, pos))) return { valid: false, reason: 'Occupied' };
  
  // NOTE: Removed the "Cannot place on track" restriction. 
  // You CAN place a landmark on a grid node that has a track segment connected to it.
  // This allows "building to a spot then placing the landmark".

  // 1. Spacing Rule: >= 3 spaces from:
  // A) Any unconnected (floating) landmark
  // B) Any landmark connected to ME
  // IGNORE opponent's connected landmarks
  const tooClose = state.placedLandmarks.some(l => {
    if (getManhattanDist(l.pos, pos) >= CONFIG.landmarkSpacing) return false;
    const isFloating = l.connectedColors.length === 0;
    const isConnectedToMe = l.connectedColors.includes(playerId);
    return isFloating || isConnectedToMe;
  });

  if (tooClose) return { valid: false, reason: 'Too close to unconnected or your landmark' };

  // 2. Proximity Rule (No "Place Anywhere")
  // Landmark must be placed within Distance 3 of YOUR existing network (Tips or City Hall)
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
  if (ch) validAnchors.push(ch.pos); // Can always place near City Hall (start)

  degreeMap.forEach((deg, key) => {
    if (deg === 1) { // Track tip
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

const canPlaceTrack = (state: GameState, from: Point, to: Point, playerId: string, cardType: 'TRACK_STRAIGHT' | 'TRACK_CURVE'): { valid: boolean; reason?: string } => {
  if (!isAdjacent(from, to)) return { valid: false, reason: 'Not adjacent' };

  const segId = getSegmentId(from, to);
  if (state.placedSegments.find(s => s.id === segId)) return { valid: false, reason: 'Track exists' };

  const isCityHall = (p: Point) => state.placedLandmarks.some(lm => pointsEqual(lm.pos, p) && lm.typeId === 'l_cityhall');
  const hasOwnTrackAt = (p: Point) => state.placedSegments.some(s => s.playerId === playerId && (pointsEqual(s.from, p) || pointsEqual(s.to, p)));

  if (!isCityHall(from) && !hasOwnTrackAt(from) && !isCityHall(to) && !hasOwnTrackAt(to)) {
    return { valid: false, reason: 'Must connect to your track' };
  }

  // Loop/Merge Check
  const fromHasMyTrack = state.placedSegments.some(s => s.playerId === playerId && (pointsEqual(s.from, from) || pointsEqual(s.to, from)));
  const toHasMyTrack = state.placedSegments.some(s => s.playerId === playerId && (pointsEqual(s.from, to) || pointsEqual(s.to, to)));
  if (fromHasMyTrack && toHasMyTrack && !isCityHall(from) && !isCityHall(to)) {
     return { valid: false, reason: "Cannot merge/loop own tracks" };
  }

  // Degree Limit (No Branching)
  const getMyDegree = (p: Point) => state.placedSegments.filter(s => s.playerId === playerId && (pointsEqual(s.from, p) || pointsEqual(s.to, p))).length;
  if (!isCityHall(from) && getMyDegree(from) >= 2) return { valid: false, reason: "No branching allowed" };
  if (!isCityHall(to) && getMyDegree(to) >= 2) return { valid: false, reason: "No branching allowed" };

  // Geometry
  const checkGeometry = (anchor: Point, target: Point) => {
    const mySegs = state.placedSegments.filter(s => s.playerId === playerId && (pointsEqual(s.from, anchor) || pointsEqual(s.to, anchor)));
    if (mySegs.length === 0) return true; 

    return mySegs.some(prev => {
      const prevEnd = pointsEqual(prev.from, anchor) ? prev.to : prev.from;
      const dx1 = anchor.x - prevEnd.x;
      const dy1 = anchor.y - prevEnd.y;
      const dx2 = target.x - anchor.x;
      const dy2 = target.y - anchor.y;
      const isStraight = (dx1 === dx2 && dy1 === dy2);
      
      if (cardType === 'TRACK_STRAIGHT') return isStraight;
      if (cardType === 'TRACK_CURVE') return !isStraight;
      return true;
    });
  };

  const validAtFrom = !hasOwnTrackAt(from) || checkGeometry(from, to);
  const validAtTo = !hasOwnTrackAt(to) || checkGeometry(to, from);

  if (!validAtFrom && !validAtTo) return { valid: false, reason: `Invalid ${cardType === 'TRACK_STRAIGHT' ? 'Straight' : 'Curve'}` };

  // Landmark Capacity
  const checkLandmarkLimit = (p: Point) => {
    const lm = state.placedLandmarks.find(l => pointsEqual(l.pos, p));
    if (!lm) return { ok: true };
    if (lm.typeId === 'l_cityhall') return { ok: true };

    const uniqueColors = new Set(lm.connectedColors);
    if (!uniqueColors.has(playerId) && uniqueColors.size >= CONFIG.maxColorsPerLandmark) {
      return { ok: false, reason: 'Landmark closed' };
    }
    const playerEdges = state.placedSegments.filter(s => 
      s.playerId === playerId && (pointsEqual(s.from, p) || pointsEqual(s.to, p))
    );
    if (playerEdges.length >= CONFIG.maxSegmentsPerLandmarkPerPlayer) {
      return { ok: false, reason: 'Max connections reached' };
    }
    return { ok: true };
  };

  const c1 = checkLandmarkLimit(from);
  if (!c1.ok) return { valid: false, reason: c1.reason };
  const c2 = checkLandmarkLimit(to);
  if (!c2.ok) return { valid: false, reason: c2.reason };

  return { valid: true };
};

const checkConnection = (state: GameState, playerId: string, typeA: string, typeB: string): boolean => {
  const instancesA = state.placedLandmarks.filter(l => l.typeId === typeA);
  const instancesB = state.placedLandmarks.filter(l => l.typeId === typeB);
  if (instancesA.length === 0 || instancesB.length === 0) return false;

  const adj = new Map<string, string[]>();
  state.placedSegments.filter(s => s.playerId === playerId).forEach(s => {
    const k1 = `${s.from.x},${s.from.y}`;
    const k2 = `${s.to.x},${s.to.y}`;
    if (!adj.has(k1)) adj.set(k1, []);
    if (!adj.has(k2)) adj.set(k2, []);
    adj.get(k1)!.push(k2);
    adj.get(k2)!.push(k1);
  });

  const targets = new Set(instancesB.map(l => `${l.pos.x},${l.pos.y}`));
  
  for (const startLm of instancesA) {
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

/**
 * ============================================================================
 * COMPONENT: APP
 * ============================================================================
 */

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'LOBBY' | 'GAME'>('LOBBY');
  const [roomCode, setRoomCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [error, setError] = useState('');
  
  // Game UI State
  const [selectedCardIdx, setSelectedCardIdx] = useState<number | null>(null);
  const [hoverNode, setHoverNode] = useState<Point | null>(null);
  const [hoverLandmark, setHoverLandmark] = useState<{ name: string, cat: string, x: number, y: number } | null>(null);
  const [selectedNode, setSelectedNode] = useState<Point | null>(null);
  const [toast, setToast] = useState<{ msg: string, type: 'error' | 'success' } | null>(null);

  // --- 1. AUTH SETUP ---
  useEffect(() => {
    const initAuth = async () => {
      // @ts-ignore
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        // @ts-ignore
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // --- 2. FIRESTORE LISTENERS ---
  useEffect(() => {
    if (!user || !roomCode || view !== 'GAME') return;

    // Rule 1: Strict Path
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', roomCode);
    
    const unsub = onSnapshot(roomRef, (snap) => {
      if (snap.exists()) {
        setGameState(snap.data() as GameState);
      } else {
        setError('Room closed or invalid');
        setView('LOBBY');
      }
    }, (err) => {
      console.error("Sync error:", err);
      setError("Connection lost");
    });

    return () => unsub();
  }, [user, roomCode, view]);

  // --- ACTIONS ---

  const createRoom = async () => {
    if (!user || !playerName) return;
    const code = Math.random().toString(36).substring(2, 6).toUpperCase();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code);
    
    const initial: GameState = {
      roomCode: code,
      status: 'WAITING',
      players: [{
        id: user.uid,
        name: playerName,
        colorIdx: 0,
        score: 0,
        segmentsPlaced: 0,
        completedPassengers: [],
        hand: [], // Will be filled on start
        lastAction: 'Created Room'
      }],
      currentPlayerIndex: 0,
      turnNumber: 1,
      placedLandmarks: [],
      placedSegments: [],
      landmarkDeck: [],
      passengerDeck: [],
      faceUpPassengers: [],
      passengerDiscard: [],
      log: ['Room created! Waiting for players...']
    };

    await setDoc(roomRef, initial);
    setRoomCode(code);
    setView('GAME');
  };

  const joinRoom = async () => {
    if (!user || !playerName || !roomCode) return;
    const code = roomCode.toUpperCase();
    const roomRef = doc(db, 'artifacts', appId, 'public', 'data', 'rooms', code);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      setError('Room not found');
      return;
    }

    const data = snap.data() as GameState;
    if (data.status !== 'WAITING') {
      setError('Game already in progress');
      return;
    }
    if (data.players.length >= 4) {
      setError('Room full');
      return;
    }
    if (data.players.some(p => p.id === user.uid)) {
      // Re-joining
      setRoomCode(code);
      setView('GAME');
      return;
    }

    const newPlayer: Player = {
      id: user.uid,
      name: playerName,
      colorIdx: data.players.length,
      score: 0,
      segmentsPlaced: 0,
      completedPassengers: [],
      hand: [],
      lastAction: 'Joined'
    };

    await updateDoc(roomRef, {
      players: [...data.players, newPlayer],
      log: [`${playerName} joined!`, ...data.log]
    });

    setRoomCode(code);
    setView('GAME');
  };

  const startGame = async () => {
    if (!gameState) return;
    
    // Setup decks
    let lDeck: string[] = [];
    LANDMARK_TYPES.forEach(l => { if (l.id !== 'l_cityhall') lDeck.push(l.id); });
    // Shuffle
    for (let i = lDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [lDeck[i], lDeck[j]] = [lDeck[j], lDeck[i]];
    }

    const pDeck = [...PASSENGER_PERSONAS].map(p => p.id);
    for (let i = pDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pDeck[i], pDeck[j]] = [pDeck[j], pDeck[i]];
    }
    const faceUp = pDeck.splice(0, 3);

    // Deal hands
    const players = [...gameState.players];
    players.forEach(p => {
      const { hand, newDeck } = generateInitialHand(lDeck);
      p.hand = hand;
      lDeck = newDeck;
    });

    const center = { x: Math.floor(CONFIG.gridSize / 2), y: Math.floor(CONFIG.gridSize / 2) };

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', gameState.roomCode), {
      status: 'PLAYING',
      landmarkDeck: lDeck,
      passengerDeck: pDeck,
      faceUpPassengers: faceUp,
      placedLandmarks: [{
        instanceId: 'city_hall',
        typeId: 'l_cityhall',
        pos: center,
        connectedColors: []
      }],
      players: players,
      log: ['Game Started! City Hall is open.', ...gameState.log]
    });
  };

  const showToast = (msg: string, type: 'error' | 'success' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // --- GAME ACTIONS ---

  const submitMove = async (newState: GameState, actionDesc: string, cardUsedIdx?: number) => {
    const s = { ...newState };
    const pIdx = s.currentPlayerIndex;
    const p = s.players[pIdx];
    p.lastAction = actionDesc;

    // Card Management
    if (cardUsedIdx !== undefined && cardUsedIdx >= 0) {
      const usedType = p.hand[cardUsedIdx].type;
      p.hand.splice(cardUsedIdx, 1);
      let newCard: HandCard | null = null;
      if (usedType === 'LANDMARK') {
         const res = drawLandmark(s.landmarkDeck);
         if (res.card) {
             newCard = res.card;
             s.landmarkDeck = res.newDeck;
         }
      } else {
         newCard = drawTrack();
      }
      if (newCard) p.hand.push(newCard);
    }

    // Check Scoring
    const claimed: string[] = [];
    const keptFaceUp: string[] = [];
    for (const pid of s.faceUpPassengers) {
      const card = PASSENGER_PERSONAS.find(x => x.id === pid)!;
      if (checkConnection(s, p.id, card.fromTypeId, card.toTypeId)) {
        claimed.push(pid);
        p.score += getPassengerPoints(pid);
        p.completedPassengers.push(pid);
        s.passengerDiscard.push(pid);
      } else {
        keptFaceUp.push(pid);
      }
    }

    // Refill Passengers
    if (claimed.length > 0) {
      s.log = [`${p.name} completed ${claimed.length} passengers!`, ...s.log];
      s.faceUpPassengers = keptFaceUp;
      while (s.faceUpPassengers.length < 3 && s.passengerDeck.length > 0) {
        s.faceUpPassengers.push(s.passengerDeck.shift()!);
      }
    }

    s.log = [`${p.name} ${actionDesc}`, ...s.log];

    // End Turn
    const gameOver = (s.passengerDeck.length === 0 && s.faceUpPassengers.length === 0) || p.score >= CONFIG.winScore;
    if (gameOver) {
      s.status = 'FINISHED';
      s.log = ['Game Over!', ...s.log];
    } else {
      s.currentPlayerIndex = (s.currentPlayerIndex + 1) % s.players.length;
      s.turnNumber++;
    }

    await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'rooms', s.roomCode), s);
    setSelectedCardIdx(null);
    setSelectedNode(null);
  };

  // --- INTERACTION ---

  const handleNodeClick = (x: number, y: number) => {
    if (!gameState || gameState.status !== 'PLAYING') return;
    const p = gameState.players[gameState.currentPlayerIndex];
    
    // Enforce Turn
    if (p.id !== user?.uid) return;

    if (selectedCardIdx === null) return;
    
    const clicked = { x, y };
    const card = p.hand[selectedCardIdx];

    if (card.type === 'LANDMARK' && card.landmarkTypeId) {
      const res = canPlaceLandmark(gameState, clicked, p.id);
      if (!res.valid) {
        showToast(res.reason || 'Invalid', 'error');
        return;
      }
      
      const newState = { ...gameState };
      
      // Create landmark
      const newLandmark: LandmarkInstance = {
        instanceId: `lm_${Date.now()}_${Math.random()}`,
        typeId: card.landmarkTypeId,
        pos: clicked,
        connectedColors: []
      };

      // Check if we placed it on a track end (instant connection)
      if (gameState.placedSegments.some(s => s.playerId === p.id && (pointsEqual(s.from, clicked) || pointsEqual(s.to, clicked)))) {
         newLandmark.connectedColors.push(p.id);
      }

      newState.placedLandmarks.push(newLandmark);
      
      const lmName = LANDMARK_TYPES.find(l => l.id === card.landmarkTypeId)?.name;
      submitMove(newState, `placed ${lmName}`, selectedCardIdx);
      return;
    }

    if (card.type.startsWith('TRACK')) {
      if (selectedNode) {
        if (pointsEqual(selectedNode, clicked)) {
          setSelectedNode(null);
        } else if (isAdjacent(selectedNode, clicked)) {
          const res = canPlaceTrack(gameState, selectedNode, clicked, p.id, card.type as any);
          if (!res.valid) {
            showToast(res.reason || 'Invalid', 'error');
            return;
          }

          const newState = { ...gameState };
          const pIdx = newState.currentPlayerIndex;
          newState.players[pIdx].segmentsPlaced++;
          newState.placedSegments.push({
            id: getSegmentId(selectedNode, clicked),
            from: selectedNode,
            to: clicked,
            playerId: p.id
          });

          // Update Connections
          const updateConn = (pt: Point) => {
            const lm = newState.placedLandmarks.find(l => pointsEqual(l.pos, pt));
            if (lm && !lm.connectedColors.includes(p.id)) {
              lm.connectedColors.push(p.id);
            }
          };
          updateConn(selectedNode);
          updateConn(clicked);

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

  // --- RENDER HELPERS ---

  const getCellContent = (x: number, y: number) => {
    if (!gameState) return null;
    const lm = gameState.placedLandmarks.find(l => l.pos.x === x && l.pos.y === y);
    if (lm) {
      const type = LANDMARK_TYPES.find(t => t.id === lm.typeId);
      if (!type) return null;
      const closed = lm.connectedColors.length >= CONFIG.maxColorsPerLandmark && type.id !== 'l_cityhall';
      return (
        <div 
            className={`absolute inset-0 flex items-center justify-center text-3xl select-none hover:scale-110 transition-transform cursor-pointer ${closed ? 'opacity-50 grayscale' : ''}`}
            onMouseEnter={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setHoverLandmark({ name: type.name, cat: type.category, x: rect.left + rect.width/2, y: rect.top - 10 });
            }}
            onMouseLeave={() => setHoverLandmark(null)}
        >
          {type.emoji}
          {closed && <div className="absolute top-1 right-1 w-2 h-2 bg-black rounded-full" />}
        </div>
      );
    }
    return null;
  };

  // --- VIEWS ---

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
              <input 
                className="w-full p-2 border rounded"
                placeholder="Enter name"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
              />
            </div>

            <div className="pt-4 border-t flex flex-col gap-3">
              <button 
                onClick={createRoom}
                disabled={!playerName}
                className="w-full py-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
              >
                Create New Room
              </button>
              
              <div className="flex gap-2">
                <input 
                  className="flex-1 p-2 border rounded uppercase"
                  placeholder="Room Code"
                  value={roomCode}
                  onChange={e => setRoomCode(e.target.value.toUpperCase())}
                  maxLength={4}
                />
                <button 
                  onClick={joinRoom}
                  disabled={!playerName || roomCode.length !== 4}
                  className="px-6 py-2 bg-slate-200 font-bold rounded hover:bg-slate-300 disabled:opacity-50"
                >
                  Join
                </button>
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
  const isMyTurn = currentPlayer.id === user?.uid;
  const myPlayer = gameState.players.find(p => p.id === user?.uid);

  if (gameState.status === 'WAITING') {
    return (
      <div className="flex h-screen bg-slate-100 items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Room: <span className="font-mono text-blue-600 text-3xl tracking-widest">{gameState.roomCode}</span></h2>
          <p className="text-slate-500 mb-6">Share this code with up to 3 friends.</p>
          
          <div className="space-y-2 mb-8 text-left">
            {gameState.players.map((p, i) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded border">
                <span className="font-bold flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${CONFIG.colors[i].tailwind}`} />
                  {p.name} {p.id === user?.uid && '(You)'}
                </span>
                <Check size={16} className="text-green-500" />
              </div>
            ))}
            {Array.from({length: 4 - gameState.players.length}).map((_, i) => (
              <div key={i} className="p-3 border border-dashed rounded text-slate-400 text-center italic">Waiting for player...</div>
            ))}
          </div>

          {gameState.players.length >= 2 && gameState.players[0].id === user?.uid ? (
            <button onClick={startGame} className="w-full py-3 bg-green-600 text-white font-bold rounded hover:bg-green-700 shadow-lg animate-pulse">
              Start Game
            </button>
          ) : (
            <div className="text-slate-400 italic">Waiting for host to start...</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden relative">
      {hoverLandmark && (
        <div className="fixed z-50 px-3 py-1 bg-slate-800 text-white text-xs rounded shadow-xl pointer-events-none transform -translate-x-1/2 -translate-y-full whitespace-nowrap"
             style={{ left: hoverLandmark.x, top: hoverLandmark.y }}>
          <div className="font-bold">{hoverLandmark.name}</div>
          <div className="text-slate-300 text-[10px]">{hoverLandmark.cat}</div>
        </div>
      )}

      {toast && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded shadow-lg text-white font-bold transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
          {toast.msg}
        </div>
      )}

      {/* BOARD */}
      <div className="flex-1 relative bg-slate-200 overflow-auto flex items-center justify-center p-8">
        <div 
          className="relative bg-white shadow-xl border-4 border-slate-300 flex-none"
          style={{ width: CONFIG.gridSize * 40, height: CONFIG.gridSize * 40 }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#e2e8f0 1px, transparent 1px), linear-gradient(90deg, #e2e8f0 1px, transparent 1px)', backgroundSize: '40px 40px' }} />

          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
            {gameState.placedSegments.map(seg => {
              const x1 = seg.from.x * 40 + 20;
              const y1 = seg.from.y * 40 + 20;
              const x2 = seg.to.x * 40 + 20;
              const y2 = seg.to.y * 40 + 20;
              // Find owner color
              const owner = gameState.players.find(p => p.id === seg.playerId);
              const color = owner ? CONFIG.colors[owner.colorIdx].hex : '#000';
              return <line key={seg.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth="8" strokeLinecap="round" />;
            })}
            
            {isMyTurn && selectedNode && selectedCardIdx !== null && myPlayer?.hand[selectedCardIdx].type.startsWith('TRACK') && (
              <>
                {[{x:0, y:1}, {x:0, y:-1}, {x:1, y:0}, {x:-1, y:0}].map((d, i) => {
                  const target = { x: selectedNode.x + d.x, y: selectedNode.y + d.y };
                  if (target.x < 0 || target.x >= CONFIG.gridSize || target.y < 0 || target.y >= CONFIG.gridSize) return null;
                  const res = canPlaceTrack(gameState, selectedNode, target, myPlayer.id, myPlayer.hand[selectedCardIdx].type as any);
                  if (res.valid) return <circle key={i} cx={target.x * 40 + 20} cy={target.y * 40 + 20} r="6" className="fill-blue-400 animate-pulse opacity-50" />;
                  return null;
                })}
              </>
            )}
            
            {isMyTurn && selectedCardIdx !== null && myPlayer?.hand[selectedCardIdx].type === 'LANDMARK' && hoverNode && (
               canPlaceLandmark(gameState, hoverNode, myPlayer.id).valid ? (
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
              return (
                <div 
                  key={i}
                  className={`relative w-full h-full transition-colors ${selectedNode?.x === x && selectedNode?.y === y ? 'bg-blue-100 ring-2 ring-blue-400 z-30 rounded' : ''}`}
                  onClick={() => handleNodeClick(x, y)}
                  onMouseEnter={() => setHoverNode({x, y})}
                >
                  {getCellContent(x, y)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="w-96 flex-none bg-white shadow-2xl flex flex-col border-l border-slate-200 z-30 h-full">
        <div className="p-4 bg-slate-800 text-white flex justify-between items-center shadow-md flex-none">
          <h1 className="text-xl font-bold flex items-center gap-2">Mind the Gap</h1>
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-700 px-2 py-1 rounded">
            RM: {gameState.roomCode} <Copy size={12} className="cursor-pointer" onClick={() => navigator.clipboard.writeText(gameState.roomCode)} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className={`p-4 rounded-lg border shadow-sm ${isMyTurn ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'}`}>
             <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-slate-500 uppercase">Turn {gameState.turnNumber}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-bold ${isMyTurn ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-600'}`}>
                  {isMyTurn ? 'YOUR TURN' : 'WAITING'}
                </span>
             </div>
             <div className="flex items-center gap-3">
               <div className={`w-3 h-12 rounded-full ${CONFIG.colors[currentPlayer.colorIdx].tailwind}`}></div>
               <div>
                  <div className="text-sm text-slate-500">Current Player</div>
                  <div className="text-lg font-bold leading-none">{currentPlayer.name}</div>
                  {isMyTurn && <div className="text-xs text-green-600 font-bold mt-1">Select a card to play</div>}
               </div>
             </div>
          </div>

          {myPlayer && (
            <div className="border-t pt-4">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                <Activity size={14} /> Your Hand
              </h3>
              <div className="flex gap-2 justify-between">
                {myPlayer.hand.map((card, idx) => {
                  const lm = card.type === 'LANDMARK' ? LANDMARK_TYPES.find(l => l.id === card.landmarkTypeId) : null;
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleCardClick(idx)}
                      disabled={!isMyTurn}
                      className={`flex-1 h-20 flex flex-col items-center justify-center rounded border-2 transition-all p-1 ${selectedCardIdx === idx ? 'border-blue-500 bg-blue-50 shadow-md scale-105' : 'border-slate-300 bg-white hover:border-slate-400 disabled:opacity-50 disabled:cursor-not-allowed'}`}
                    >
                      {card.type === 'TRACK_STRAIGHT' && <ArrowUp className="text-slate-700 mb-1" />}
                      {card.type === 'TRACK_CURVE' && <CornerUpRight className="text-slate-700 mb-1" />}
                      {card.type === 'LANDMARK' && <div className="text-2xl mb-1">{lm?.emoji}</div>}
                      <span className="text-[9px] font-bold text-center leading-none truncate w-full">
                        {card.type === 'LANDMARK' ? lm?.name : (card.type === 'TRACK_STRAIGHT' ? 'STRAIGHT' : 'CURVE')}
                      </span>
                    </button>
                  );
                })}
              </div>
              
              {isMyTurn && selectedCardIdx !== null && myPlayer.hand[selectedCardIdx].type === 'LANDMARK' && (
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800 flex items-start gap-2">
                  <AlertCircle size={16} className="mt-0.5 flex-none"/>
                  <span>Must be 3 spaces from unconnected/your landmarks. Can be on tracks.</span>
                </div>
              )}
            </div>
          )}

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
              <Users size={14}/> Passengers ({gameState.passengerDeck.length} left)
            </h3>
            <div className="space-y-2">
               {gameState.faceUpPassengers.map(pid => {
                 const p = PASSENGER_PERSONAS.find(x => x.id === pid)!;
                 const lFrom = LANDMARK_TYPES.find(l => l.id === p.fromTypeId)!;
                 const lTo = LANDMARK_TYPES.find(l => l.id === p.toTypeId)!;
                 const pts = CONFIG.points[lTo.difficulty];
                 const completedByMe = myPlayer?.completedPassengers.includes(pid);
                 return (
                   <div key={pid} className={`relative p-3 rounded border bg-white shadow-sm flex flex-col gap-1 transition-all ${completedByMe ? 'ring-2 ring-green-400 bg-green-50' : 'border-slate-200'}`}>
                      <div className="flex justify-between items-start">
                         <span className="font-bold text-sm text-slate-800">{p.personaName}</span>
                         <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-1.5 py-0.5 rounded">{pts} VP</span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1 flex-wrap">
                         <span className="font-semibold">{lFrom.emoji} {lFrom.name}</span> 
                         <FastForward size={10} className="text-slate-400"/>
                         <span className="font-semibold">{lTo.emoji} {lTo.name}</span>
                      </div>
                   </div>
                 )
               })}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Leaderboard</h3>
            <div className="bg-white rounded border border-slate-200 divide-y">
               {gameState.players.sort((a,b) => b.score - a.score).map(p => (
                 <div key={p.id} className="p-2 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                       <div className={`w-3 h-3 rounded-full ${CONFIG.colors[p.colorIdx].tailwind}`} />
                       <span className={p.id === user?.uid ? 'font-bold' : ''}>{p.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="font-mono font-bold">{p.score} VP</div>
                       {p.lastAction && <div className="text-[10px] text-slate-400 italic max-w-[100px] truncate">{p.lastAction}</div>}
                    </div>
                 </div>
               ))}
            </div>
          </div>
          
          <div className="border-t pt-4">
             <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Log</h3>
             <div className="h-24 overflow-y-auto text-xs space-y-1 text-slate-600 font-mono bg-slate-50 p-2 rounded border border-slate-200">
                {gameState.log.map((entry, i) => (
                  <div key={i} className="border-b border-slate-100 last:border-0 pb-1">{entry}</div>
                ))}
             </div>
          </div>
        </div>
      </div>

      {gameState.status === 'FINISHED' && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 max-w-md w-full text-center">
             <Trophy size={48} className="mx-auto text-yellow-500 mb-4" />
             <h2 className="text-2xl font-bold mb-2">Game Over!</h2>
             <p className="text-slate-600 mb-6">
               Winner: <span className="font-bold text-slate-900">{gameState.players.sort((a,b) => b.score - a.score)[0].name}</span>
             </p>
             <button onClick={() => setView('LOBBY')} className="w-full py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700 transition">
               Back to Lobby
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
