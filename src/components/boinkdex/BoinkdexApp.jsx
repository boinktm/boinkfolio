import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  Zap,
  Shield,
  Heart,
  Sword,
  Activity,
  Globe,
  MapPin,
  Sparkles,
  BookOpen,
  Layers,
  Flame,
  Brain,
  Loader2,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Star,
  Save,
  Copy,
  Check,
  Download,
  Upload,
} from 'lucide-react';

const typeColors = {
  normal: 'bg-gray-400',
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  electric: 'bg-yellow-400',
  grass: 'bg-green-500',
  ice: 'bg-blue-200',
  fighting: 'bg-red-700',
  poison: 'bg-purple-500',
  ground: 'bg-yellow-700',
  flying: 'bg-indigo-300',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-yellow-800',
  ghost: 'bg-purple-700',
  dragon: 'bg-indigo-600',
  dark: 'bg-gray-800',
  steel: 'bg-gray-500',
  fairy: 'bg-pink-300',
};

const PokeballIcon = ({ size = 20, captured, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" fill={captured ? '#ef4444' : 'white'} stroke="black" />
    <path d="M2 12h20" stroke="black" />
    <circle cx="12" cy="12" r="3" fill="white" stroke="black" />
  </svg>
);

const gameGroups = [
  { id: 'kanto', name: 'RED/BLUE/YEL', dexId: 2, versions: ['red', 'blue', 'yellow'], icon: BookOpen, gen: 'generation-i', ver: 'red-blue' },
  { id: 'johto', name: 'GOLD/SIL/CRY', dexId: 3, versions: ['gold', 'silver', 'crystal'], icon: Sparkles, gen: 'generation-ii', ver: 'gold' },
  { id: 'hoenn', name: 'RUBY/SAPH/EME', dexId: 4, versions: ['ruby', 'sapphire', 'emerald'], icon: Zap, gen: 'generation-iii', ver: 'emerald' },
  { id: 'kanto-remake', name: 'FIRE/LEAF', dexId: 2, versions: ['fire-red', 'leaf-green'], icon: Flame, gen: 'generation-iii', ver: 'firered-leafgreen' },
  { id: 'sinnoh', name: 'DIA/PEA/PLA', dexId: 5, versions: ['diamond', 'pearl', 'platinum'], icon: Globe, gen: 'generation-iv', ver: 'platinum' },
  { id: 'unova', name: 'BLACK / WHITE', dexId: 8, versions: ['black', 'white'], icon: Layers, gen: 'generation-v', ver: 'black-white' },
  { id: 'kalos', name: 'X / Y', dexId: 12, versions: ['x', 'y'], icon: Activity, gen: 'generation-vi', ver: 'x-y' },
  { id: 'alola', name: 'SUN / MOON', dexId: 16, versions: ['sun', 'moon'], icon: Flame, gen: 'generation-vii', ver: 'ultra-sun-ultra-moon' },
  { id: 'galar', name: 'SWORD / SHIELD', dexId: 27, versions: ['sword', 'shield'], icon: Sword, gen: 'generation-viii', ver: 'icons' },
  { id: 'paldea', name: 'SCAR / VIO', dexId: 31, versions: ['scarlet', 'violet'], icon: Star, gen: null, ver: null },
];

const versionColors = {
  red:      { hex: '#ef4444', rgb: '239,68,68' },
  blue:     { hex: '#3b82f6', rgb: '59,130,246' },
  yellow:   { hex: '#eab308', rgb: '234,179,8' },
  gold:     { hex: '#d97706', rgb: '217,119,6' },
  silver:   { hex: '#94a3b8', rgb: '148,163,184' },
  crystal:  { hex: '#22d3ee', rgb: '34,211,238' },
  ruby:     { hex: '#dc2626', rgb: '220,38,38' },
  sapphire: { hex: '#2563eb', rgb: '37,99,235' },
  emerald:  { hex: '#10b981', rgb: '16,185,129' },
  'fire-red': { hex: '#b91c1c', rgb: '185,28,28' },
  'leaf-green': { hex: '#16a34a', rgb: '22,163,74' },
  diamond:  { hex: '#60a5fa', rgb: '96,165,250' },
  pearl:    { hex: '#f9a8d4', rgb: '249,168,212' },
  platinum: { hex: '#a1a1aa', rgb: '161,161,170' },
  black:    { hex: '#71717a', rgb: '113,113,122' },
  white:    { hex: '#e4e4e7', rgb: '228,228,231' },
  x:        { hex: '#3b82f6', rgb: '59,130,246' },
  y:        { hex: '#ef4444', rgb: '239,68,68' },
  sun:      { hex: '#f97316', rgb: '249,115,22' },
  moon:     { hex: '#8b5cf6', rgb: '139,92,246' },
  sword:    { hex: '#06b6d4', rgb: '6,182,212' },
  shield:   { hex: '#ec4899', rgb: '236,72,153' },
  scarlet:  { hex: '#dc2626', rgb: '220,38,38' },
  violet:   { hex: '#8b5cf6', rgb: '139,92,246' },
};

const boinkdexStyles = `
  @keyframes boinkdex-scanline {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes boinkdex-ai-in {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes boinkdex-detail-in {
    0% { opacity: 0; transform: translateY(40px) scale(0.97); }
    100% { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes boinkdex-detail-out {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(40px) scale(0.97); }
  }
  @keyframes boinkdex-backdrop-in {
    0% { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes boinkdex-backdrop-out {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes boinkdex-glow-pulse {
    0%, 100% { filter: drop-shadow(0 0 3px rgba(239,68,68,0.4)); }
    50% { filter: drop-shadow(0 0 8px rgba(239,68,68,0.8)); }
  }
  @keyframes boinkdex-card-appear {
    0% { opacity: 0; transform: translateX(-12px); }
    100% { opacity: 1; transform: translateX(0); }
  }
  .boinkdex-root .detail-slide-in {
    animation: boinkdex-detail-in 350ms cubic-bezier(0.16, 1, 0.3, 1) both;
  }
  .boinkdex-root .detail-slide-out {
    animation: boinkdex-detail-out 250ms cubic-bezier(0.4, 0, 1, 1) both;
  }
  .boinkdex-root .backdrop-in {
    animation: boinkdex-backdrop-in 250ms ease-out both;
  }
  .boinkdex-root .backdrop-out {
    animation: boinkdex-backdrop-out 200ms ease-in both;
  }
  .boinkdex-root .pokeball-captured {
    animation: boinkdex-glow-pulse 2.5s ease-in-out infinite;
  }
  .boinkdex-root .card-row {
    animation: boinkdex-card-appear 300ms ease-out both;
  }
  .boinkdex-root .card-row:hover {
    filter: drop-shadow(0 0 10px rgba(var(--accent-rgb),0.15));
  }
  .boinkdex-root .type-badge-glow {
    transition: box-shadow 0.3s ease;
  }
  .boinkdex-root .type-badge-glow:hover {
    box-shadow: 0 0 16px 2px currentColor;
  }
  .boinkdex-root .stat-bar-glow {
    box-shadow: 0 0 6px rgba(var(--accent-rgb),0.3);
  }
  .boinkdex-root .header-glow {
    box-shadow: 0 2px 20px rgba(var(--accent-rgb),0.12), 0 0 60px rgba(var(--accent-rgb),0.05);
  }
  .boinkdex-root .bg-red-grid {
    background-color: #8b1a1a;
    background-image: linear-gradient(#6e1414 1px, transparent 1px), linear-gradient(90deg, #6e1414 1px, transparent 1px);
    background-size: 30px 30px;
  }
  .boinkdex-root .unova-clip {
    clip-path: polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%);
  }
  .boinkdex-root .unova-hex {
    clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  }
  .boinkdex-root .unova-scan {
    background: linear-gradient(to bottom, transparent, rgba(239, 68, 68, 0.1), transparent);
    animation: boinkdex-scanline 4s linear infinite;
  }
  .boinkdex-root .custom-scrollbar::-webkit-scrollbar { width: 4px; }
  .boinkdex-root .custom-scrollbar::-webkit-scrollbar-track { background: #000; }
  .boinkdex-root .custom-scrollbar::-webkit-scrollbar-thumb { background: #e67e22; }
  .boinkdex-root .no-scrollbar::-webkit-scrollbar { display: none; }
  .boinkdex-root .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  .boinkdex-root .boinkdex-ai-in { animation: boinkdex-ai-in 250ms ease-out both; }

  /* Y2K header styling */
  .boinkdex-root .y2k-header {
    background: linear-gradient(180deg, #0c0c0c 0%, #0a0808 60%, #0d0606 100%);
    clip-path: polygon(0 0, 100% 0, 100% calc(100% - 12px), 97% 100%, 3% 100%, 0 calc(100% - 12px));
    border-bottom: none;
  }
  .boinkdex-root .y2k-header::before {
    content: '';
    position: absolute;
    inset: 0;
    background:
      linear-gradient(90deg, transparent 49.5%, rgba(var(--accent-rgb),0.04) 49.5%, rgba(var(--accent-rgb),0.04) 50.5%, transparent 50.5%),
      linear-gradient(0deg, transparent 49.5%, rgba(var(--accent-rgb),0.04) 49.5%, rgba(var(--accent-rgb),0.04) 50.5%, transparent 50.5%),
      linear-gradient(180deg, rgba(var(--accent-rgb),0.06) 0%, transparent 30%, transparent 70%, rgba(var(--accent-rgb),0.04) 100%);
    background-size: 40px 40px, 40px 40px, 100% 100%;
    pointer-events: none;
  }
  .boinkdex-root .y2k-header::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 3%;
    right: 3%;
    height: 3px;
    background: linear-gradient(90deg, transparent, var(--accent), transparent);
    box-shadow: 0 0 12px rgba(var(--accent-rgb),0.5), 0 0 30px rgba(var(--accent-rgb),0.25);
  }
  .boinkdex-root .y2k-corner {
    position: absolute;
    width: 20px;
    height: 20px;
    border-color: rgba(var(--accent-rgb),0.4);
    pointer-events: none;
  }
  .boinkdex-root .y2k-corner-tl { top: 6px; left: 6px; border-top: 2px solid; border-left: 2px solid; }
  .boinkdex-root .y2k-corner-tr { top: 6px; right: 6px; border-top: 2px solid; border-right: 2px solid; }
  .boinkdex-root .y2k-corner-bl { bottom: 14px; left: 6px; border-bottom: 2px solid; border-left: 2px solid; }
  .boinkdex-root .y2k-corner-br { bottom: 14px; right: 6px; border-bottom: 2px solid; border-right: 2px solid; }
  .boinkdex-root .y2k-search {
    clip-path: polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px));
  }
  .boinkdex-root .y2k-btn {
  }
  .boinkdex-root .y2k-chrome {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    border: 1px solid rgba(var(--accent-rgb),0.15);
  }
  @media (min-width: 1800px) {
    .boinkdex-root .boinkdex-grid-list {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
  }
  @media (min-width: 2400px) {
    .boinkdex-root .boinkdex-grid-list {
      grid-template-columns: repeat(6, minmax(0, 1fr));
    }
  }
`;

const App = () => {
  const [pokemonList, setPokemonList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPokemon, setSelectedPokemon] = useState(null);
  const [speciesData, setSpeciesData] = useState(null);
  const [evolutionChain, setEvolutionChain] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [currentGroup, setCurrentGroup] = useState(gameGroups[4]);
  const [selectedVersion, setSelectedVersion] = useState(gameGroups[4].versions[0]);
  const [showShiny, setShowShiny] = useState(false);
  const [error, setError] = useState(null);

  const [capturedData, setCapturedData] = useState({});
  const [viewMode, setViewMode] = useState('all');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState({ type: '', msg: '' });

  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const currentlyAnalyzingId = useRef(null);

  const [detailClosing, setDetailClosing] = useState(false);
  const detailTimeoutRef = useRef(null);

  const accent = versionColors[selectedVersion] || versionColors.yellow;

  const closeDetail = () => {
    setDetailClosing(true);
    detailTimeoutRef.current = setTimeout(() => {
      setSelectedPokemon(null);
      setDetailClosing(false);
    }, 250);
  };

  useEffect(() => {
    return () => { if (detailTimeoutRef.current) clearTimeout(detailTimeoutRef.current); };
  }, []);

  const isRetroGen = useMemo(() => currentGroup.id === 'kanto' || currentGroup.id === 'johto', [currentGroup]);

  useEffect(() => {
    if (!window.jsQR) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
      script.async = true;
      document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const saveData = params.get('saveData');
    if (saveData) {
      handleRestore(saveData);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleRestore = (saveData) => {
    try {
      const parsed = JSON.parse(atob(saveData));
      const restored = {};
      for (const [version, ids] of Object.entries(parsed)) {
        restored[version] = {};
        ids.forEach((id) => {
          restored[version][id] = true;
        });
      }
      setCapturedData(restored);
      return true;
    } catch (e) {
      console.error('Invalid save data', e);
      return false;
    }
  };

  const generateSaveCode = () => {
    try {
      const optimized = {};
      for (const [version, captures] of Object.entries(capturedData)) {
        const caughtIds = Object.keys(captures)
          .filter((id) => captures[id])
          .map(Number);
        if (caughtIds.length > 0) optimized[version] = caughtIds;
      }
      return btoa(JSON.stringify(optimized));
    } catch (e) {
      return '';
    }
  };

  const handleCopySaveCode = () => {
    const code = generateSaveCode();
    if (!code) return;

    const textArea = document.createElement('textarea');
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    document.body.removeChild(textArea);
  };

  const downloadQrCode = async () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(
      `${window.location.origin}${window.location.pathname}?saveData=${generateSaveCode()}`
    )}`;
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `boinkdex-backup-${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code', err);
    }
  };

  const handleQrUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !window.jsQR) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0, img.width, img.height);
        const imageData = context.getImageData(0, 0, img.width, img.height);
        const code = window.jsQR(imageData.data, imageData.width, imageData.height);

        if (code) {
          try {
            const url = new URL(code.data);
            const saveData = url.searchParams.get('saveData');
            if (saveData && handleRestore(saveData)) {
              setImportStatus({ type: 'success', msg: 'QR_DATABASE_SYNCED!' });
              setTimeout(() => {
                setShowSaveModal(false);
                setImportStatus({ type: '', msg: '' });
              }, 1500);
            } else {
              setImportStatus({ type: 'error', msg: 'INVALID_QR_PAYLOAD' });
            }
          } catch (err) {
            setImportStatus({ type: 'error', msg: 'NOT_A_BOINKDEX_QR' });
          }
        } else {
          setImportStatus({ type: 'error', msg: 'NO_QR_DETECTED' });
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleImportSaveCode = () => {
    if (handleRestore(importCode)) {
      setImportStatus({ type: 'success', msg: 'LOADED!' });
      setTimeout(() => {
        setShowSaveModal(false);
        setImportStatus({ type: '', msg: '' });
        setImportCode('');
      }, 1500);
    } else {
      setImportStatus({ type: 'error', msg: 'INVALID CODE' });
    }
  };

  const generateAiInsight = () => {
    if (!selectedPokemon) return;
    const targetId = selectedPokemon.id;
    currentlyAnalyzingId.current = targetId;
    setAiLoading(true);
    setAiAnalysis(null);

    window.setTimeout(() => {
      if (currentlyAnalyzingId.current !== targetId) return;
      setAiAnalysis({
        type: 'offline',
        content: 'TACTICAL_MODEL_OFFLINE. Keep pressure with type advantage, preserve a safe switch option, and scout priority moves before committing your finisher.',
      });
      setAiLoading(false);
    }, 500);
  };

  useEffect(() => {
    const fetchDex = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`https://pokeapi.co/api/v2/pokedex/${currentGroup.dexId}/`);
        const data = await response.json();

        const detailPromises = data.pokemon_entries.map((entry) =>
          fetch(entry.pokemon_species.url.replace('pokemon-species', 'pokemon')).then((res) => res.json())
        );
        const details = await Promise.all(detailPromises);
        setPokemonList(details);
        setLoading(false);
      } catch (err) {
        setError('Failed to load database.');
        setLoading(false);
      }
    };

    fetchDex();
  }, [currentGroup]);

  useEffect(() => {
    setAiAnalysis(null);
    setAiLoading(false);
    if (!selectedPokemon) {
      setSpeciesData(null);
      setEvolutionChain([]);
      setEncounters([]);
      return;
    }

    const fetchExtraData = async () => {
      try {
        const speciesResponse = await fetch(selectedPokemon.species.url);
        const species = await speciesResponse.json();
        setSpeciesData(species);

        const evoResponse = await fetch(species.evolution_chain.url);
        const evoData = await evoResponse.json();
        const chain = [];
        let currentPart = evoData.chain;

        while (currentPart) {
          const speciesId = currentPart.species.url.split('/').filter(Boolean).pop();
          chain.push({ name: currentPart.species.name, id: speciesId, sprite: getSimpleSprite(speciesId) });
          currentPart = currentPart.evolves_to[0];
        }
        setEvolutionChain(chain);

        const encounterResponse = await fetch(selectedPokemon.location_area_encounters);
        setEncounters(await encounterResponse.json());
      } catch (err) {
        console.error(err);
      }
    };

    fetchExtraData();
  }, [selectedPokemon]);

  const currentVersionEncounters = useMemo(() => {
    if (!encounters.length || !selectedVersion) return [];
    return encounters
      .filter((loc) => loc.version_details.some((v) => v.version.name === selectedVersion))
      .map((loc) => ({
        name: loc.location_area.name.replace(/-/g, ' '),
        chance: loc.version_details.find((v) => v.version.name === selectedVersion).max_chance,
      }));
  }, [encounters, selectedVersion]);

  const filteredPokemon = useMemo(() => {
    let filtered = pokemonList;
    if (viewMode === 'captured') filtered = filtered.filter((p) => !!capturedData[selectedVersion]?.[p.id]);
    return filtered.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [pokemonList, searchTerm, viewMode, capturedData, selectedVersion]);

  const handleNext = () => {
    if (!selectedPokemon) return;
    const idx = pokemonList.findIndex((p) => p.id === selectedPokemon.id);
    if (idx < pokemonList.length - 1) setSelectedPokemon(pokemonList[idx + 1]);
  };

  const handlePrev = () => {
    if (!selectedPokemon) return;
    const idx = pokemonList.findIndex((p) => p.id === selectedPokemon.id);
    if (idx > 0) setSelectedPokemon(pokemonList[idx - 1]);
  };

  const getPokemonSprite = (pokemon, group, isShiny) => {
    if (!pokemon) return '';
    const spriteType = isShiny ? 'front_shiny' : 'front_default';

    if (group.gen && group.ver) {
      try {
        const versionSprite = pokemon.sprites.versions[group.gen][group.ver][spriteType];
        if (versionSprite) return versionSprite;
      } catch (e) {
        // Fall through to generic artwork.
      }
    }

    return pokemon.sprites.other['official-artwork'][spriteType] || pokemon.sprites[spriteType];
  };

  const getSimpleSprite = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

  const selectEvoPokemon = async (evoId) => {
    const numId = Number(evoId);
    if (numId === selectedPokemon?.id) return;
    const found = pokemonList.find((p) => p.id === numId);
    if (found) {
      setSelectedPokemon(found);
    } else {
      try {
        const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${numId}/`);
        const data = await res.json();
        setSelectedPokemon(data);
      } catch (e) {
        console.error('Failed to fetch evo pokemon', e);
      }
    }
  };

  const toggleCapture = (e, pokemonId) => {
    if (e) e.stopPropagation();

    setCapturedData((prev) => {
      const versionCaptures = prev[selectedVersion] || {};
      return {
        ...prev,
        [selectedVersion]: {
          ...versionCaptures,
          [pokemonId]: !versionCaptures[pokemonId],
        },
      };
    });
  };

  const StatBar = ({ label, value, max = 255, icon: Icon }) => (
    <div className="mb-2">
      <div className="mb-0.5 flex items-center justify-between text-[9px] font-bold uppercase tracking-tighter text-slate-500">
        <span className="flex items-center gap-2">
          {Icon && <Icon size={10} />}
          {label.replace('-', ' ')}
        </span>
        <span className="font-mono text-white">{value}</span>
      </div>
      <div className="h-1 w-full overflow-hidden bg-[#222]">
        <div className="h-full stat-bar-glow transition-all duration-700 ease-out" style={{ width: `${Math.min(100, (value / max) * 100)}%`, backgroundColor: 'var(--accent)' }} />
      </div>
    </div>
  );

  return (
    <div className="boinkdex-root min-h-screen overflow-x-hidden bg-black text-[13px] font-mono text-white selection:bg-[var(--accent)] selection:text-black" style={{ '--accent': accent.hex, '--accent-rgb': accent.rgb }}>
      <style>{boinkdexStyles}</style>

      <div className="sticky top-0 z-[60] flex items-center justify-between border-b-4 bg-[#1a1a1a] px-2 py-2 shadow-2xl header-glow sm:px-4 lg:px-6 xl:px-8" style={{ borderColor: 'var(--accent)' }}>
        <div className="flex items-center gap-4">
          <div className="skew-x-[-12deg] px-4 py-1 text-sm font-black tracking-tighter text-black sm:text-base" style={{ backgroundColor: 'var(--accent)' }}>BOINKDEX_SYSTEM_V5</div>
          <div className="hidden animate-pulse text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 sm:block">CONNECTION_STABLE</div>
        </div>
        <div className="flex gap-4 sm:gap-12">
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">SEEN</div>
            <div className="text-lg font-black tabular-nums sm:text-xl">{pokemonList.length}</div>
          </div>
          <div className="text-right">
            <div className="text-[8px] font-bold uppercase tracking-widest text-slate-500">OBTAINED</div>
            <div className="text-lg font-black tabular-nums sm:text-xl" style={{ color: 'var(--accent)' }}>{Object.keys(capturedData[selectedVersion] || {}).filter((k) => capturedData[selectedVersion][k]).length}</div>
          </div>
        </div>
      </div>

      <header className="y2k-header relative z-50 px-2 py-5 pb-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Y2K corner brackets */}
        <div className="y2k-corner y2k-corner-tl" />
        <div className="y2k-corner y2k-corner-tr" />
        <div className="y2k-corner y2k-corner-bl" />
        <div className="y2k-corner y2k-corner-br" />

        <div className="relative z-10 flex flex-col gap-5">
          <div className="flex flex-col items-center justify-between gap-5 lg:flex-row">
            <div className="relative w-full lg:w-[500px]">
              <Search className="absolute top-1/2 left-4 -translate-y-1/2 z-10" size={20} style={{ color: 'var(--accent)' }} />
              <input
                type="text"
                placeholder="INPUT_QUERY..."
                className="y2k-search w-full border-2 border-slate-800 bg-black py-3 pr-4 pl-12 text-sm font-bold uppercase tracking-widest outline-none transition-all focus:border-[var(--accent)] focus:shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <div className="y2k-chrome skew-x-[-16deg] flex gap-1 p-1">
                <button onClick={() => setViewMode('all')} className={`px-8 py-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'text-black shadow-lg' : 'bg-transparent text-slate-500 hover:text-white'}`} style={viewMode === 'all' ? { backgroundColor: 'var(--accent)' } : undefined}>
                  <span className="inline-block skew-x-[16deg]">REGISTRY</span>
                </button>
                <button onClick={() => setViewMode('captured')} className={`px-8 py-2 text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'captured' ? 'bg-red-600 text-white' : 'bg-transparent text-slate-500 hover:text-white'}`}>
                  <span className="inline-block skew-x-[16deg]">VAULT</span>
                </button>
              </div>
              <button onClick={() => setShowShiny(!showShiny)} className={`skew-x-[-16deg] border-2 px-8 py-2 text-xs font-black uppercase tracking-widest transition-all ${showShiny ? 'text-black shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]' : 'border-slate-700 bg-slate-800 text-slate-500'}`} style={showShiny ? { borderColor: 'var(--accent)', backgroundColor: 'var(--accent)' } : undefined}>
                <span className="inline-block skew-x-[16deg]">SHINY</span>
              </button>
              <button onClick={() => setShowSaveModal(true)} className="skew-x-[-16deg] bg-white px-8 py-2 text-xs font-black uppercase tracking-widest text-black transition-colors hover:brightness-90" onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                <span className="inline-block skew-x-[16deg]"><Save size={16} /></span>
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="no-scrollbar flex flex-1 gap-0.5 overflow-x-auto pl-2 pb-1">
                {gameGroups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      setCurrentGroup(g);
                      setSelectedVersion(g.versions[0]);
                    }}
                    className={`skew-x-[-16deg] px-6 py-2.5 text-[10px] font-black uppercase whitespace-nowrap transition-all ${currentGroup.id === g.id ? 'text-black shadow-[0_0_12px_rgba(var(--accent-rgb),0.25)]' : 'bg-slate-900 text-slate-500 hover:bg-slate-800 hover:text-white'}`}
                    style={currentGroup.id === g.id ? { backgroundColor: 'var(--accent)' } : undefined}
                  >
                    <span className="inline-block skew-x-[16deg]">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="skew-x-[-16deg] w-fit border border-white/5 bg-slate-900/40 p-1.5">
                <span className="mr-2 inline-block skew-x-[16deg] self-center px-2 text-[9px] font-black uppercase tracking-widest text-slate-600">VERSION:</span>
                {currentGroup.versions.map((v) => (
                  <button key={v} onClick={() => setSelectedVersion(v)} className={`px-4 py-1 text-[9px] font-black uppercase tracking-tighter transition-all ${selectedVersion === v ? 'bg-white text-black' : 'text-slate-500 hover:text-white'}`}>
                    <span className="inline-block skew-x-[16deg]">{v}</span>
                  </button>
                ))}
              </div>
              <div className="hidden shrink-0 text-right lg:block">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500">LIVING&nbsp;DEX&nbsp;TRACKER&nbsp;//&nbsp;BROWSE,&nbsp;SEARCH&nbsp;&&nbsp;MARK&nbsp;POKÉMON&nbsp;AS&nbsp;CAUGHT&nbsp;ACROSS&nbsp;EVERY&nbsp;GENERATION</p>
                <p className="text-[10px] leading-relaxed tracking-wide text-slate-600">Presented by: <span style={{ color: 'var(--accent)' }}>Boink!</span></p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="bg-red-grid min-h-screen px-2 py-4 sm:px-4 md:py-8 lg:px-6 xl:px-8">
        <div>
          {loading ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {[...Array(16)].map((_, i) => (
                <div key={i} className="h-16 border-l-4 border-slate-800 bg-black/40 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="py-40 text-center flex flex-col items-center gap-6">
              <div className="w-20 h-20 border-4 border-red-600 rounded-full flex items-center justify-center">
                <X size={40} className="text-red-600" />
              </div>
              <div className="text-2xl font-black text-red-500 uppercase tracking-tighter">{error}</div>
            </div>
          ) : filteredPokemon.length === 0 ? (
            <div className="flex flex-col items-center gap-6 py-40 text-center">
              <div className="flex h-20 w-20 animate-pulse items-center justify-center rounded-full border-4 border-slate-800">
                <Search size={40} className="text-slate-700" />
              </div>
              <div className="text-2xl font-black tracking-tighter text-slate-500 uppercase">DATA UNAVAILABLE</div>
            </div>
          ) : (
            <div className="boinkdex-grid-list grid grid-cols-1 gap-x-8 gap-y-3 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredPokemon.map((p) => {
                const isCaptured = !!capturedData[selectedVersion]?.[p.id];
                return (
                  <div key={p.id} onClick={() => setSelectedPokemon(p)} className="group card-row flex h-16 cursor-pointer items-center" style={{ animationDelay: `${(filteredPokemon.indexOf(p) % 20) * 25}ms` }}>
                    <div className={`unova-hex z-10 -mr-6 flex h-16 w-16 shrink-0 items-center justify-center border-2 border-slate-800 ${isRetroGen ? 'bg-white' : 'bg-black'} transition-colors`} style={{ '--hover-border': 'var(--accent)' }} onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                      <img src={getPokemonSprite(p, currentGroup, showShiny)} alt={p.name} className="h-11 w-11 object-contain transition-transform group-hover:scale-125" />
                    </div>
                    <div className={`unova-clip flex h-full flex-1 items-center justify-between border-r-4 bg-black/90 px-10 transition-all group-hover:bg-[#1a1a1a] ${isCaptured ? 'border-red-600 shadow-[inset_-10px_0_10px_rgba(220,38,38,0.1)]' : 'border-slate-800'}`}>
                      <div className="flex items-center gap-4">
                        <span className="font-mono text-[10px] font-bold" style={{ color: 'var(--accent)' }}>#{p.id.toString().padStart(3, '0')}</span>
                        <span className="text-xs font-black tracking-[0.15em] uppercase sm:text-sm">{p.name}</span>
                      </div>
                      <button onClick={(e) => toggleCapture(e, p.id)} className="transition-transform hover:scale-125 focus:outline-none">
                        <span className={isCaptured ? 'pokeball-captured inline-block' : ''}>
                          <PokeballIcon size={18} captured={isCaptured} />
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {selectedPokemon && (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-0 backdrop-blur-sm sm:p-4 md:p-8 ${detailClosing ? 'backdrop-out' : 'backdrop-in'}`}>
          <div className={`relative flex h-full w-full max-h-screen max-w-[1600px] flex-col overflow-hidden rounded-none border-4 border-slate-900 bg-[#0d0d0d] shadow-2xl sm:h-auto sm:max-h-[92vh] ${detailClosing ? 'detail-slide-out' : 'detail-slide-in'}`}>
            <div className="unova-scan pointer-events-none absolute inset-0 z-10" />

            <div className="relative z-20 flex shrink-0 items-center justify-between border-b-4 border-black/20 bg-[#e67e22] p-4">
              <div className="flex items-center gap-6">
                <div className="skew-x-[-12deg] bg-black px-4 py-1.5 text-xs font-black tracking-tighter text-white sm:text-base">DATA_RETRIEVAL: {selectedPokemon.name.toUpperCase()}</div>
                <div className="hidden items-center gap-2 text-[10px] font-black text-black/60 md:flex">
                  <Loader2 size={12} className="animate-spin" /> ENCRYPTION_ACTIVE
                </div>
              </div>
              <button onClick={closeDetail} className="bg-black/10 p-1.5 text-black transition-all hover:bg-black/30 sm:p-2">
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            <div className="custom-scrollbar relative z-20 flex-1 overflow-y-auto">
              <div className="grid min-h-full lg:grid-cols-12">
                <div className="flex flex-col items-center border-b border-white/5 bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#000_100%)] p-6 sm:p-10 lg:col-span-4 lg:border-r lg:border-b-0">
                  <div className={`relative w-full max-w-[400px] aspect-square overflow-hidden border border-white/10 shadow-inner ${isRetroGen ? 'bg-white' : 'bg-white/5'} flex items-center justify-center group`}>
                    <div className={`absolute top-4 left-4 h-6 w-6 border-t-2 border-l-2 ${isRetroGen ? 'border-slate-300' : ''}`} style={!isRetroGen ? { borderColor: `rgba(${accent.rgb},0.5)` } : undefined} />
                    <div className={`absolute top-4 right-4 h-6 w-6 border-t-2 border-r-2 ${isRetroGen ? 'border-slate-300' : ''}`} style={!isRetroGen ? { borderColor: `rgba(${accent.rgb},0.5)` } : undefined} />
                    <div className={`absolute bottom-4 left-4 h-6 w-6 border-b-2 border-l-2 ${isRetroGen ? 'border-slate-300' : ''}`} style={!isRetroGen ? { borderColor: `rgba(${accent.rgb},0.5)` } : undefined} />
                    <div className={`absolute right-4 bottom-4 h-6 w-6 border-r-2 border-b-2 ${isRetroGen ? 'border-slate-300' : ''}`} style={!isRetroGen ? { borderColor: `rgba(${accent.rgb},0.5)` } : undefined} />

                    <img
                      src={getPokemonSprite(selectedPokemon, currentGroup, showShiny)}
                      alt={selectedPokemon.name}
                      className={`h-[75%] w-[75%] object-contain drop-shadow-[0_15px_30px_rgba(255,255,255,0.05)] transition-transform duration-700 group-hover:scale-110 ${isRetroGen ? '[image-rendering:pixelated]' : ''}`}
                    />

                    <div className="absolute right-6 bottom-4 text-[7px] font-black tracking-widest text-slate-600 uppercase">FEED_STABLE_4K</div>
                  </div>

                  <div className="mt-8 flex gap-3">
                    {selectedPokemon.types.map((t) => (
                      <span key={t.type.name} className={`${typeColors[t.type.name]} type-badge-glow skew-x-[-12deg] border border-black/20 px-6 py-2 text-[10px] font-black uppercase shadow-xl`}>
                        {t.type.name}
                      </span>
                    ))}
                  </div>

                  <div className="mt-8 flex w-full max-w-[400px] gap-2 border border-white/5 bg-slate-900/50 p-2">
                    <button onClick={handlePrev} className="group flex flex-1 items-center justify-center border border-white/10 bg-black py-4 transition-all hover:text-black" onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                      <ChevronLeft size={24} className="group-hover:scale-125" />
                    </button>
                    <button onClick={handleNext} className="group flex flex-1 items-center justify-center border border-white/10 bg-black py-4 transition-all hover:text-black" onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                      <ChevronRight size={24} className="group-hover:scale-125" />
                    </button>
                  </div>

                  <div className="mt-8 w-full max-w-[400px] border-l-4 bg-[#111] p-4" style={{ borderColor: 'var(--accent)' }}>
                    <h4 className="mb-4 text-[9px] font-black tracking-widest text-slate-500 uppercase">EVOLUTION_PATH</h4>
                    <div className="no-scrollbar flex items-center gap-3 overflow-x-auto py-2">
                      {evolutionChain.map((evo, i) => (
                        <React.Fragment key={evo.id}>
                          <div
                            className="shrink-0 flex flex-col items-center cursor-pointer group/evo"
                            onClick={() => selectEvoPokemon(evo.id)}
                          >
                            <div className={`flex h-10 w-10 items-center justify-center border-2 bg-black transition-all ${evo.id === selectedPokemon.id.toString() ? '' : 'border-slate-800'}`} style={evo.id === selectedPokemon.id.toString() ? { borderColor: 'var(--accent)', boxShadow: `0 0 8px rgba(${accent.rgb},0.4)` } : undefined}>
                              <img src={evo.sprite} className="h-8 w-8 transition-transform group-hover/evo:scale-110" alt={evo.name} />
                            </div>
                            <span className="mt-1 max-w-[40px] truncate text-[7px] font-black text-slate-500 uppercase transition-colors" onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.color = ''}>{evo.name}</span>
                          </div>
                          {i < evolutionChain.length - 1 && <ArrowRight size={10} className="shrink-0 text-slate-700" />}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-[#121212] p-6 sm:p-10 lg:col-span-8 lg:p-14">
                  <div className="mb-12 flex flex-col items-start justify-between gap-6 border-b border-white/5 pb-8 sm:flex-row">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-4">
                        <span className="font-mono text-xl font-black tracking-tighter sm:text-2xl" style={{ color: 'var(--accent)' }}>ID: {selectedPokemon.id.toString().padStart(4, '0')}</span>
                        {speciesData?.is_legendary && <span className="skew-x-[-12deg] animate-pulse bg-red-600 px-2 py-0.5 text-[10px] font-black">LEGENDARY_ASSET</span>}
                      </div>
                      <h2 className="text-5xl leading-none font-black tracking-tighter text-white uppercase break-words sm:text-6xl xl:text-7xl">{selectedPokemon.name}</h2>
                    </div>
                    <button
                      onClick={() => toggleCapture(null, selectedPokemon.id)}
                      className={`w-full skew-x-[-12deg] border-4 px-10 py-5 text-sm font-black transition-all sm:w-auto ${capturedData[selectedVersion]?.[selectedPokemon.id] ? 'border-red-500 bg-red-600 text-white shadow-[0_0_20px_rgba(220,38,38,0.3)]' : 'border-slate-800 bg-black text-slate-600'}`}
                      onMouseEnter={e => { if (!capturedData[selectedVersion]?.[selectedPokemon.id]) e.currentTarget.style.borderColor = 'var(--accent)'; }}
                      onMouseLeave={e => { if (!capturedData[selectedVersion]?.[selectedPokemon.id]) e.currentTarget.style.borderColor = ''; }}
                    >
                      {capturedData[selectedVersion]?.[selectedPokemon.id] ? 'INDEX_SAVED' : 'AWAITING_CAPTURE...'}
                    </button>
                  </div>

                  <div className="mb-12 grid grid-cols-2 gap-4 md:grid-cols-4">
                    {[
                      { label: 'HT', value: `${selectedPokemon.height / 10} m` },
                      { label: 'WT', value: `${selectedPokemon.weight / 10} kg` },
                      { label: 'HABITAT', value: speciesData?.habitat?.name || 'Varies' },
                      { label: 'BASE_EXP', value: selectedPokemon.base_experience || '---' },
                    ].map((stat) => (
                      <div key={stat.label} className="border-l-4 bg-black/60 p-4 shadow-sm" style={{ borderColor: 'var(--accent)' }}>
                        <div className="mb-1 text-[9px] font-black tracking-widest text-slate-600 uppercase">{stat.label}</div>
                        <div className="truncate text-xl font-black text-slate-200 uppercase">{stat.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-10 xl:grid-cols-12">
                    <div className="space-y-10 xl:col-span-5">
                      <div className="relative border-r-8 bg-[#1a1a1a] p-6 text-sm leading-relaxed text-slate-300 italic shadow-2xl" style={{ borderColor: 'var(--accent)' }}>
                        <div className="absolute top-2 left-4 text-[7px] font-black text-slate-600 uppercase">ARCHIVE_051_FRAG</div>
                        "{speciesData ? speciesData.flavor_text_entries.find((entry) => entry.language.name === 'en')?.flavor_text.replace(/\f/g, ' ') : 'DATA_CORRUPT_RETRYING...'}"
                      </div>

                      <div className="space-y-4">
                        <h4 className="border-b border-white/5 pb-2 text-[10px] font-black tracking-[0.4em] text-slate-600 uppercase">COMBAT_PROJECTION</h4>
                        <div className="space-y-1">
                          {selectedPokemon.stats.map((s) => (
                            <StatBar
                              key={s.stat.name}
                              label={s.stat.name}
                              value={s.base_stat}
                              icon={s.stat.name === 'hp' ? Heart : s.stat.name === 'attack' ? Sword : s.stat.name === 'defense' ? Shield : Zap}
                            />
                          ))}
                        </div>
                        <div className="pt-2 text-right">
                          <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: 'var(--accent)' }}>TOTAL: {selectedPokemon.stats.reduce((acc, s) => acc + s.base_stat, 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-10 xl:col-span-7">
                      <div className="space-y-4">
                        <h4 className="flex items-center justify-between border-b border-white/5 pb-2 text-[10px] font-black tracking-[0.4em] text-slate-600 uppercase">
                          <span>LOCATION_INDEX: {selectedVersion.toUpperCase()}</span>
                          <MapPin size={12} style={{ color: 'var(--accent)' }} />
                        </h4>
                        <div className="custom-scrollbar max-h-[220px] space-y-1.5 overflow-y-auto pr-3">
                          {currentVersionEncounters.length > 0 ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {currentVersionEncounters.map((loc, idx) => (
                                <div key={idx} className="group flex items-center justify-between border border-white/5 bg-black p-3 transition-colors" onMouseEnter={e => e.currentTarget.style.borderColor = `rgba(${accent.rgb},0.3)`} onMouseLeave={e => e.currentTarget.style.borderColor = ''}>
                                  <span className="max-w-[120px] truncate text-[10px] font-bold text-slate-500 uppercase transition-colors group-hover:text-slate-200">{loc.name}</span>
                                  <span className="text-[9px] font-black transition-colors" style={{ color: `rgba(${accent.rgb},0.6)` }} onMouseEnter={e => e.currentTarget.style.color = accent.hex} onMouseLeave={e => e.currentTarget.style.color = `rgba(${accent.rgb},0.6)`}>{loc.chance}%</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-800 bg-black/40 py-12 opacity-40">
                              <Globe size={24} className="mb-2" />
                              <span className="px-4 text-center text-[9px] font-black tracking-widest uppercase">WILD_HABITAT_NULL</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button onClick={generateAiInsight} disabled={aiLoading} className="group flex w-full items-center justify-center gap-4 bg-white py-5 text-sm font-black tracking-widest text-black uppercase shadow-xl transition-all disabled:opacity-50" onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                          {aiLoading ? <Loader2 className="animate-spin" /> : <Brain className="transition-transform group-hover:scale-125" />}
                          {aiLoading ? 'FETCHING...' : 'STRAT_PROJECTION_V1'}
                        </button>
                        {aiAnalysis && <div className="boinkdex-ai-in border-2 border-indigo-500/30 bg-indigo-900/10 p-6 text-[11px] font-bold leading-relaxed text-indigo-200 shadow-inner">{aiAnalysis.content}</div>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center justify-between border-t border-white/10 bg-black px-6 py-4 text-[9px] font-black tracking-[0.2em] text-slate-600 uppercase">
              <div className="flex gap-8">
                <span className="flex items-center gap-2">
                  <span style={{ color: 'var(--accent)' }}>A</span> SELECT
                </span>
                <span className="flex items-center gap-2">
                  <span style={{ color: 'var(--accent)' }}>B</span> BACK
                </span>
                <span className="hidden items-center gap-2 sm:flex">
                  <span style={{ color: 'var(--accent)' }}>&lt;- / -&gt;</span> PREV/NEXT
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.8)]" />
                BOINKDEX_OS_UNOVA_LATEST
              </div>
            </div>
          </div>
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <div className="relative w-full max-w-xl border-4 bg-[#111] p-8 shadow-2xl sm:p-10" style={{ borderColor: 'var(--accent)' }}>
            <button onClick={() => setShowSaveModal(false)} className="absolute top-6 right-6 text-slate-500 transition-colors hover:text-white">
              <X size={24} />
            </button>
            <h2 className="mb-8 border-b-2 border-white/5 pb-4 text-3xl font-black tracking-tighter text-white uppercase sm:text-4xl">SYNC_PROGRESS</h2>

            <div className="flex flex-col items-center gap-8 md:flex-row lg:gap-12">
              <div className="flex flex-col items-center gap-4">
                <div className="inline-block shrink-0 border-4 border-slate-800 bg-white p-4 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`${window.location.origin}${window.location.pathname}?saveData=${generateSaveCode()}`)}`}
                    alt="QR"
                    className="h-32 w-32 sm:h-40 sm:w-40"
                  />
                </div>
                <div className="flex gap-4">
                  <button onClick={downloadQrCode} className="flex items-center gap-2 text-[10px] font-black uppercase transition-colors hover:text-white" style={{ color: 'var(--accent)' }}>
                    <Download size={14} /> EXPORT_PNG
                  </button>
                  <label className="flex cursor-pointer items-center gap-2 text-[10px] font-black uppercase transition-colors hover:text-white" style={{ color: 'var(--accent)' }}>
                    <Upload size={14} /> SCAN_PNG
                    <input type="file" accept="image/*" className="hidden" onChange={handleQrUpload} />
                  </label>
                </div>
              </div>
              <div className="w-full flex-1 space-y-6">
                <div className="space-y-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">ACCESS_TOKEN</span>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={generateSaveCode()} className="flex-1 overflow-hidden overflow-ellipsis whitespace-nowrap border-2 border-slate-800 bg-black p-4 text-[10px] font-bold text-slate-500 uppercase outline-none" />
                    <button onClick={handleCopySaveCode} className="bg-slate-800 p-4 transition-all hover:text-black" title="Copy Token" onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--accent)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = ''}>
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black tracking-widest text-slate-500 uppercase">IMPORT_DATABASE</span>
                  <input type="text" placeholder="PASTE_TOKEN_HERE..." value={importCode} onChange={(e) => setImportCode(e.target.value)} className="w-full border-2 border-slate-800 bg-black p-4 text-xs font-bold uppercase outline-none transition-all focus:border-[var(--accent)]" style={{ color: 'var(--accent)' }} />
                </div>
                <button onClick={handleImportSaveCode} className="w-full py-4 text-sm font-black text-black uppercase transition-all hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]" style={{ backgroundColor: 'var(--accent)' }}>
                  RESTORE_PROGRESS
                </button>
                {importStatus.msg && <p className="text-center text-[10px] font-black tracking-widest uppercase animate-pulse" style={{ color: 'var(--accent)' }}>{importStatus.msg}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
