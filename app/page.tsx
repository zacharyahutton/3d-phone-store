'use client';

import { Canvas } from '@react-three/fiber';
import Aurora from '../components/Aurora';
import { Experience } from '../components/Experience';
import ElectricBorder from '../components/ElectricBorder';
import ScrollFloat from '../components/ScrollFloat';
import { ScrollSynchronizer } from '../ui/ScrollSynchronizer';
import { FloatingNav } from '../ui/FloatingNav';
import { LoadingScreen } from '../ui/LoadingScreen';
import { ReactLenis, useLenis } from '@studio-freight/react-lenis';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpRight, Check, ChevronRight, Clock, CreditCard, LogOut, Minus, Package, Plus, Save, Search, Shield, ShoppingBag, Trash2, Truck, User, X } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useStore } from '../store';
import * as THREE from 'three';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const SECTION_INDICATORS = [
  { id: 'overview', selector: '#hero-trigger' },
  { id: 'specs', selector: '#section-specs' },
  { id: 'configure', selector: '#section-customizer' },
  { id: 'craft', selector: '#section-craft' },
  { id: 'reserve', selector: '#section-checkout' },
];

const PROFILE_STORAGE_KEY = 'titan-profile-v1';
const SAVED_BUILDS_STORAGE_KEY = 'titan-saved-builds-v1';
const PROFILE_PREFS_STORAGE_KEY = 'titan-profile-prefs-v1';

type TitanProfile = { name: string; email: string; phone: string };
type TitanSavedBuild = { id: string; finish: string; color: string; storage: string; scale: number; total: string; profileEmail: string };
type TitanProfilePrefs = {
  launchAlerts: boolean;
  titanCare: boolean;
  fastCheckout: boolean;
  preferredDelivery: string;
};

const defaultProfileForm: TitanProfile = { name: '', email: '', phone: '' };
const defaultProfilePrefs: TitanProfilePrefs = {
  launchAlerts: true,
  titanCare: true,
  fastCheckout: true,
  preferredDelivery: 'Priority Air',
};

function readStoredProfile(): TitanProfile | null {
  if (typeof window === 'undefined') return null;

  try {
    const storedProfile = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    return storedProfile ? JSON.parse(storedProfile) : null;
  } catch {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    return null;
  }
}

function readStoredPrefs(): TitanProfilePrefs {
  if (typeof window === 'undefined') return defaultProfilePrefs;

  try {
    const storedPrefs = window.localStorage.getItem(PROFILE_PREFS_STORAGE_KEY);
    return storedPrefs ? { ...defaultProfilePrefs, ...JSON.parse(storedPrefs) } : defaultProfilePrefs;
  } catch {
    window.localStorage.removeItem(PROFILE_PREFS_STORAGE_KEY);
    return defaultProfilePrefs;
  }
}

function readStoredBuilds(): TitanSavedBuild[] {
  if (typeof window === 'undefined') return [];

  try {
    const storedBuilds = window.localStorage.getItem(SAVED_BUILDS_STORAGE_KEY);
    return storedBuilds ? JSON.parse(storedBuilds) : [];
  } catch {
    window.localStorage.removeItem(SAVED_BUILDS_STORAGE_KEY);
    return [];
  }
}

function CelestialSphere({ hue = 210.0, speed = 0.4, zoom = 1.2, particleSize = 4.0 }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const currentMount = mountRef.current;
    let scene: THREE.Scene, camera: THREE.OrthographicCamera, renderer: THREE.WebGLRenderer, material: THREE.ShaderMaterial, mesh: THREE.Mesh;
    let animationFrameId: number;
    const mouse = new THREE.Vector2(0.5, 0.5);

    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      precision highp float;
      varying vec2 vUv;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform vec2 u_mouse;
      uniform float u_hue;
      uniform float u_zoom;
      uniform float u_particle_size;

      vec3 hsl2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0), 6.0)-3.0)-1.0, 0.0, 1.0);
        return c.z * mix(vec3(1.0), rgb, c.y);
      }
      float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
      }
      float noise(vec2 st) {
        vec2 i = floor(st);
        vec2 f = fract(st);
        float a = random(i);
        float b = random(i + vec2(1.0, 0.0));
        float c = random(i + vec2(0.0, 1.0));
        float d = random(i + vec2(1.0, 1.0));
        vec2 u = f * f * (3.0 - 2.0 * f);
        return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.y * u.x;
      }
      float fbm(vec2 st) {
        float value = 0.0;
        float amplitude = 0.5;
        for (int i = 0; i < 6; i++) {
          value += amplitude * noise(st);
          st *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }
      void main() {
        vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.y, u_resolution.x);
        uv *= u_zoom;
        vec2 mouse_normalized = u_mouse / u_resolution;
        uv += (mouse_normalized - 0.5) * 0.8;
        float f = fbm(uv + vec2(u_time * 0.1, u_time * 0.05));
        float t = fbm(uv + f + vec2(u_time * 0.05, u_time * 0.02));
        float nebula = pow(t, 2.0);
        vec3 color = hsl2rgb(vec3(u_hue / 360.0 + nebula * 0.2, 0.7, 0.5));
        color *= nebula * 2.5;
        float star_val = random(vUv * 500.0);
        if (star_val > 0.998) {
            float star_brightness = (star_val - 0.998) / 0.002;
            color += vec3(star_brightness * u_particle_size);
        }
        gl_FragColor = vec4(color, 1.0);
      }
    `;

    const init = () => {
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 0.8));
      currentMount.appendChild(renderer.domElement);

      material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          u_time: { value: 0.0 },
          u_resolution: { value: new THREE.Vector2() },
          u_mouse: { value: new THREE.Vector2() },
          u_hue: { value: hue },
          u_zoom: { value: zoom },
          u_particle_size: { value: particleSize },
        },
      });

      mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
      scene.add(mesh);
      resize();
      window.addEventListener("resize", resize);
      window.addEventListener("mousemove", onMouseMove);
      animate();
    };

    const animate = () => {
      material.uniforms.u_time.value += 0.005 * speed;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    const resize = () => {
      if (!currentMount) return;
      const { clientWidth, clientHeight } = currentMount;
      renderer.setSize(clientWidth, clientHeight);
      material.uniforms.u_resolution.value.set(clientWidth, clientHeight);
      camera.updateProjectionMatrix();
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = currentMount.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
      material.uniforms.u_mouse.value.set(mouse.x, currentMount.clientHeight - mouse.y);
    };

    init();

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouseMove);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        currentMount.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [hue, speed, zoom, particleSize]);

  return <div ref={mountRef} className="absolute inset-0 w-full h-full" />;
}

export default function Home() {
  const setFrameColor  = useStore((state) => state.setFrameColor);
  const currentColor   = useStore((state) => state.frameColor);
  const modelScale     = useStore((state) => state.modelScale || 1);
  const setModelScale  = useStore((state) => state.setModelScale);

  const customizerRef   = useRef<HTMLDivElement>(null);
  const bigSideTextRef  = useRef<HTMLHeadingElement>(null);
  const promptTextRef   = useRef<HTMLDivElement>(null);
  const actionButtonRef = useRef<HTMLDivElement>(null);
  const siteRef         = useRef<HTMLDivElement>(null);
  const canvasWrapRef   = useRef<HTMLDivElement>(null);
  const celestialWrapRef = useRef<HTMLDivElement>(null);
  const heroTitleRef    = useRef<HTMLHeadingElement>(null);
  
  // Specs Page Grid Elements
  const specsSectionRef = useRef<HTMLDivElement>(null);
  const specsHeaderRef  = useRef<HTMLDivElement>(null);
  const specsLeftRef    = useRef<HTMLDivElement>(null);
  const specsRightRef   = useRef<HTMLDivElement>(null);

  const lenis = useLenis();
  const [activeStorage, setActiveStorage] = useState('256GB');
  const [isLoading, setIsLoading]         = useState(true);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [activeSpecDetail, setActiveSpecDetail] = useState<string | null>(null);
  const [isSavedBuildsOpen, setIsSavedBuildsOpen] = useState(false);
  const [isCareOpen, setIsCareOpen] = useState(false);
  const [isProfileSetupOpen, setIsProfileSetupOpen] = useState(false);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [deliveryFocus, setDeliveryFocus] = useState('Build configured');
  const [paymentStep, setPaymentStep] = useState<'shipping' | 'review'>('shipping');
  const [selectedShipping, setSelectedShipping] = useState('free');
  const [shippingForm, setShippingForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    country: 'United States',
    state: 'Georgia',
    city: '',
    zip: '',
    street: '',
  });
  const [savedProfile, setSavedProfile] = useState<TitanProfile | null>(null);
  const [profileForm, setProfileForm] = useState<TitanProfile>(defaultProfileForm);
  const [profilePrefs, setProfilePrefs] = useState<TitanProfilePrefs>(defaultProfilePrefs);
  const [profileErrors, setProfileErrors] = useState<{ name?: string; email?: string; phone?: string; submit?: string }>({});
  const [profileNotice, setProfileNotice] = useState('');
  const [lastProfileSaveAt, setLastProfileSaveAt] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [savedBuilds, setSavedBuilds] = useState<TitanSavedBuild[]>([]);
  const [cartQuantity, setCartQuantity] = useState(1);
  const [activeSection, setActiveSection] = useState('overview');
  const [isNearPageEnd, setIsNearPageEnd] = useState(false);
  const [activeHeaderPanel, setActiveHeaderPanel] = useState<'search' | 'cart' | 'profile' | null>(null);
  const [expandedSavedBuildId, setExpandedSavedBuildId] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);

  const colorOptions = [
    { name: 'TITAN BLACK',  value: '#121212' },
    { name: 'SATIN SILVER', value: '#dcdcdc' },
    { name: 'DESERT GOLD',  value: '#dfc2a5' },
    { name: 'EMERALD CORE', value: '#1a3322' },
    { name: 'SIGNAL RED',   value: '#b60f24' },
  ];

  const storageOptions = ['256GB', '512GB', '1TB', '2TB'];
  const storagePrices: Record<string, string> = {
    '256GB': '$1,299',
    '512GB': '$1,499',
    '1TB': '$1,799',
    '2TB': '$2,199',
  };

  const activeColorName = colorOptions.find((color) => color.value === currentColor)?.name ?? 'ORIGINAL COLOR';
  const countries = [
    'United States', 'Canada', 'United Kingdom', 'Australia', 'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Sweden',
    'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Switzerland', 'Austria', 'Belgium', 'Japan', 'South Korea',
    'Singapore', 'United Arab Emirates', 'Saudi Arabia', 'Mexico', 'Brazil', 'India', 'South Africa', 'New Zealand',
  ];
  const usStates = [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
    'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
    'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
    'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
    'West Virginia', 'Wisconsin', 'Wyoming',
  ];
  const shippingMethods = [
    { id: 'free', label: 'Launch Courier', price: 0, copy: 'Free insured shipping in 5-7 business days.' },
    { id: 'priority', label: 'Priority Air', price: 29.99, copy: 'Faster routing with 2-3 business day delivery.' },
    { id: 'studio', label: 'Studio Express', price: 49.99, copy: 'Fastest shipping with signature and setup priority.' },
  ];
  const unitPrice = Number(storagePrices[activeStorage].replace(/[$,]/g, ''));
  const activeShipping = shippingMethods.find((method) => method.id === selectedShipping) ?? shippingMethods[0];
  const paymentTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(unitPrice * cartQuantity + activeShipping.price);
  const precisionStats = [
    { value: '3nm', label: 'Neural silicon process' },
    { value: '48MP', label: 'Fusion optic array' },
    { value: '120Hz', label: 'Adaptive XDR canvas' },
  ];
  const specDetails = [
    {
      id: 'silicon',
      eyebrow: 'Silicon',
      title: 'A18 Bionic',
      detail: 'A 3nm neural graphics engine keeps interface animation, camera previews, and checkout motion stable under heavy load.',
      callout: '3nm neural graphics pipeline',
      accent: 'from-sky-300 via-cyan-200 to-white',
      part: 'logic-core',
      metrics: ['3nm process', 'Neural UI acceleration', 'Sustained thermal pacing'],
      deepDive: 'The chip profile prioritizes stable frame delivery, instant camera previews, and responsive product animation under load.',
    },
    {
      id: 'optics',
      eyebrow: 'Optics',
      title: 'Fusion 48MP',
      detail: 'A stabilized optic matrix pairs fluorite coating with frame-by-frame sensor-shift correction before the shot reaches the display.',
      callout: 'Triple lens stabilization stack',
      accent: 'from-cyan-200 via-white to-slate-300',
      part: 'camera-array',
      metrics: ['48MP fusion sensor', 'Fluorite coating', 'Sensor-shift correction'],
      deepDive: 'Optics are tuned around clarity, low vibration, and clean preview response so every detail feels intentional before capture.',
    },
    {
      id: 'metallurgy',
      eyebrow: 'Metallurgy',
      title: 'Titanium G5',
      detail: 'Grade 5 titanium gives the chassis a rigid, light frame with a hand-tuned edge profile and precise button travel.',
      callout: 'Aerospace body rail',
      accent: 'from-slate-100 via-sky-200 to-zinc-500',
      part: 'frame-rail',
      metrics: ['Grade 5 titanium', 'Precision rail polish', 'Rigid button travel'],
      deepDive: 'The chassis uses a lighter, stiffer rail structure with hand-feel tuning around grip, weight, and long-session comfort.',
    },
    {
      id: 'display',
      eyebrow: 'Display',
      title: '120Hz XDR',
      detail: 'The adaptive XDR canvas changes refresh rhythm around touch, scroll, video, and idle states to preserve studio-grade smoothness.',
      callout: 'Adaptive LTPO display layer',
      accent: 'from-emerald-200 via-cyan-300 to-sky-500',
      part: 'display-stack',
      metrics: ['120Hz adaptive refresh', 'XDR contrast mapping', 'Touch-aware pacing'],
      deepDive: 'The display stack adapts refresh timing around gestures, video, idle moments, and checkout motion to keep the interface calm.',
    },
  ];
  const activeSpec = specDetails.find((spec) => spec.id === activeSpecDetail);
  const craftPanels = [
    {
      eyebrow: 'Thermal Core',
      title: 'Vapor spine',
      copy: 'A pressure-balanced cooling channel keeps sustained graphics clean during long creative sessions.',
    },
    {
      eyebrow: 'Display Stack',
      title: 'Ceramic XDR',
      copy: 'A brighter panel, thinner bonding layer, and tuned contrast map make the product feel alive in motion.',
    },
    {
      eyebrow: 'Concierge',
      title: 'White-glove setup',
      copy: 'Every locked configuration includes priority setup, transfer support, and launch-day delivery routing.',
    },
  ];
  const checkoutPerks = ['Priority build queue', 'TitanCare+ included', 'Launch-day courier', '14-day studio trial'];
  const cartTotal = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(unitPrice * cartQuantity);
  const checkoutFinishColor = currentColor ?? '#d8e8e8';
  const checkoutFinishHighlight = currentColor ? '#ffffff' : '#f8fbfb';
  const checkoutScreenGlow = currentColor ?? '#d8e8e8';

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const storedProfile = readStoredProfile();
      const storedPrefs = readStoredPrefs();
      const storedBuilds = readStoredBuilds();

      if (storedProfile) {
        setSavedProfile(storedProfile);
        setProfileForm(storedProfile);
      }

      setProfilePrefs(storedPrefs);
      setSavedBuilds(storedBuilds);
      setStorageReady(true);
    }, 0);

    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!storageReady || !savedProfile) return;

    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(savedProfile));
  }, [savedProfile, storageReady]);

  useEffect(() => {
    if (!storageReady) return;

    window.localStorage.setItem(SAVED_BUILDS_STORAGE_KEY, JSON.stringify(savedBuilds));
  }, [savedBuilds, storageReady]);

  useEffect(() => {
    if (!storageReady) return;

    window.localStorage.setItem(PROFILE_PREFS_STORAGE_KEY, JSON.stringify(profilePrefs));
  }, [profilePrefs, storageReady]);

  const handleEnterLab = () => {
    window.dispatchEvent(new Event('triggerLabCinematic'));
    if (lenis) {
      lenis.scrollTo('#section-specs', {
        duration: 2.4,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      });
    }
  };

  const openCheckout = () => {
    setPaymentStep('shipping');
    setActiveHeaderPanel(null);
    setIsCheckoutOpen(true);
  };
  const saveCurrentBuild = () => {
    if (!savedProfile) {
      setIsProfileSetupOpen(true);
      return;
    }

    setSavedBuilds((builds) => {
      const nextBuild = {
        id: `TITAN-${Date.now().toString().slice(-5)}`,
        finish: activeColorName,
        color: checkoutFinishColor,
        storage: activeStorage,
        scale: Math.round(modelScale * 100),
        total: cartTotal,
        profileEmail: savedProfile.email,
      };

      return [nextBuild, ...builds.filter((build) => build.id !== nextBuild.id)];
    });
    setActiveHeaderPanel(null);
    setIsSavedBuildsOpen(true);
  };

  const submitProfile = () => {
    const now = Date.now();
    if (now - lastProfileSaveAt < 1800) {
      setProfileErrors({ submit: 'Please wait a moment before saving again.' });
      return;
    }

    const name = profileForm.name.trim();
    const email = profileForm.email.trim().toLowerCase();
    const phone = profileForm.phone.trim();
    const nextErrors: typeof profileErrors = {};

    if (name.length < 2) {
      nextErrors.name = 'Enter your full name.';
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Enter a valid email address.';
    }

    if (phone.replace(/\D/g, '').length < 10) {
      nextErrors.phone = 'Enter a valid phone number.';
    }

    if (Object.keys(nextErrors).length) {
      setProfileErrors(nextErrors);
      setProfileNotice('');
      return;
    }

    setLastProfileSaveAt(now);
    setProfileErrors({});
    setProfileNotice('Profile saved on this device.');
    setSavedProfile({ name, email, phone });
    setProfileForm({ name, email, phone });
    setIsProfileSetupOpen(false);
    setIsProfileOpen(true);
  };

  const logoutProfile = () => {
    setSavedProfile(null);
    setProfileForm({ name: '', email: '', phone: '' });
    setProfileErrors({});
    setProfileNotice('');
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
  };

  const runSearchAction = (action: () => void) => {
    action();
    setIsSearchOpen(false);
  };

  const searchItems = [
    {
      eyebrow: 'Configure',
      title: 'Titan Black finish',
      copy: 'Apply the stealth black finish in the Lab.',
      keywords: 'black color finish configure lab titan',
      action: () => {
        setFrameColor('#121212');
        lenis?.scrollTo('#section-customizer', { duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
      },
    },
    {
      eyebrow: 'Configure',
      title: 'Signal Red finish',
      copy: 'Switch the Titan shell to red and open the Lab.',
      keywords: 'red color finish configure lab signal',
      action: () => {
        setFrameColor('#b60f24');
        lenis?.scrollTo('#section-customizer', { duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
      },
    },
    {
      eyebrow: 'Storage',
      title: '1TB Pro storage',
      copy: 'Select 1TB storage for a higher-end build.',
      keywords: '1tb storage capacity memory configure',
      action: () => {
        setActiveStorage('1TB');
        lenis?.scrollTo('#section-customizer', { duration: 1.1, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
      },
    },
    {
      eyebrow: 'Specs',
      title: 'Fusion 48MP optics',
      copy: 'Open the optics detail with the camera stack preview.',
      keywords: 'camera optics fusion 48mp specs lens',
      action: () => setActiveSpecDetail('optics'),
    },
    {
      eyebrow: 'Specs',
      title: 'A18 Bionic chip',
      copy: 'Jump to the performance suite and chip detail.',
      keywords: 'a18 bionic chip silicon performance specs',
      action: () => setActiveSpecDetail('silicon'),
    },
    {
      eyebrow: 'Account',
      title: 'Saved builds',
      copy: 'View saved Titan configurations for this profile.',
      keywords: 'saved builds account profile save',
      action: () => savedProfile ? setIsSavedBuildsOpen(true) : setIsProfileSetupOpen(true),
    },
    {
      eyebrow: 'Account',
      title: 'Delivery tracking',
      copy: 'Open the launch-day delivery tracker.',
      keywords: 'delivery tracking shipping status courier',
      action: () => savedProfile ? setIsDeliveryOpen(true) : setIsProfileSetupOpen(true),
    },
    {
      eyebrow: 'Coverage',
      title: 'TitanCare coverage',
      copy: 'Review protection, setup, and concierge support.',
      keywords: 'titancare coverage warranty shield protection support',
      action: () => savedProfile ? setIsCareOpen(true) : setIsProfileSetupOpen(true),
    },
    {
      eyebrow: 'Checkout',
      title: 'Reserve build',
      copy: 'Open the checkout summary for the current Titan.',
      keywords: 'checkout reserve build cart payment buy',
      action: openCheckout,
    },
  ];
  const visibleSearchItems = searchItems.filter((item) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return true;
    return `${item.eyebrow} ${item.title} ${item.copy} ${item.keywords}`.toLowerCase().includes(query);
  }).slice(0, 6);

  const handlePageStep = () => {
    const sectionPositions = SECTION_INDICATORS
      .map((section) => {
        const element = document.querySelector(section.selector);
        if (!element) return null;

        return {
          selector: section.selector,
          top: element.getBoundingClientRect().top + window.scrollY,
        };
      })
      .filter(Boolean) as Array<{ selector: string; top: number }>;

    const nextSection = sectionPositions.find((section) => section.top > window.scrollY + window.innerHeight * 0.28);
    const target = isNearPageEnd ? 0 : nextSection?.top ?? document.documentElement.scrollHeight - window.innerHeight;

    if (lenis) {
      lenis.scrollTo(target, {
        duration: 1.65,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  const handlePageUp = () => {
    const sectionPositions = SECTION_INDICATORS
      .map((section) => {
        const element = document.querySelector(section.selector);
        if (!element) return null;

        return {
          selector: section.selector,
          top: element.getBoundingClientRect().top + window.scrollY,
        };
      })
      .filter(Boolean) as Array<{ selector: string; top: number }>;

    const previousSection = [...sectionPositions]
      .reverse()
      .find((section) => section.top < window.scrollY - window.innerHeight * 0.24);
    const target = previousSection?.top ?? 0;

    if (lenis) {
      lenis.scrollTo(target, {
        duration: 1.45,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
      });
    } else {
      window.scrollTo({ top: target, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (isLoading) return;

    let snapTimer: number | null = null;
    const snapPoints = ['#section-specs', '#section-customizer'];

    const scheduleSnap = () => {
      if (snapTimer) window.clearTimeout(snapTimer);

      snapTimer = window.setTimeout(() => {
        const viewportHeight = window.innerHeight;
        const currentY = window.scrollY;

        const nearest = snapPoints
          .map((selector) => {
            const element = document.querySelector(selector);
            if (!element) return null;

            const top = element.getBoundingClientRect().top + currentY;
            return {
              selector,
              top,
              distance: Math.abs(currentY - top),
            };
          })
          .filter(Boolean)
          .sort((a, b) => a!.distance - b!.distance)[0];

        if (!nearest) return;

        const isNearSnapPoint = nearest.distance < viewportHeight * 0.2;
        const isAlreadyAligned = nearest.distance < 10;

        if (isNearSnapPoint && !isAlreadyAligned) {
          if (lenis) {
            lenis.scrollTo(nearest.selector, {
              duration: 0.62,
              lock: false,
              offset: 0,
              easing: (t: number) => 1 - Math.pow(1 - t, 5),
            });
          } else {
            window.scrollTo({
              top: nearest.top,
              behavior: 'smooth',
            });
          }
        }
      }, 420);
    };

    window.addEventListener('wheel', scheduleSnap, { passive: true });
    window.addEventListener('touchend', scheduleSnap, { passive: true });

    return () => {
      if (snapTimer) window.clearTimeout(snapTimer);
      window.removeEventListener('wheel', scheduleSnap);
      window.removeEventListener('touchend', scheduleSnap);
    };
  }, [isLoading, lenis]);

  useEffect(() => {
    if (isLoading) return;

    const updateActiveSection = () => {
      const markerY = window.innerHeight * 0.45;
      setIsNearPageEnd(window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 140);
      const current = SECTION_INDICATORS
        .map((section) => {
          const element = document.querySelector(section.selector);

          if (!element) {
            return null;
          }

          const rect = element.getBoundingClientRect();
          return {
            id: section.id,
            distance: Math.abs(rect.top - markerY),
            isInView: rect.top <= markerY && rect.bottom >= markerY,
          };
        })
        .filter(Boolean)
        .sort((a, b) => {
          if (a!.isInView !== b!.isInView) {
            return a!.isInView ? -1 : 1;
          }

          return a!.distance - b!.distance;
        })[0];

      if (current) {
        setActiveSection((previous) => (previous === current.id ? previous : current.id));
      }
    };
    updateActiveSection();
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    window.addEventListener('resize', updateActiveSection);

    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      window.removeEventListener('resize', updateActiveSection);
    };
  }, [isLoading]);

  // Scroll-driven animations (only register after loading is done)
  useEffect(() => {
    if (isLoading) return;
    if (!promptTextRef.current || !actionButtonRef.current) return;

    // 1. Fade out scroll prompt and CTA on hero movement initial crawl
    gsap.timeline({
      scrollTrigger: {
        trigger: '#hero-trigger',
        start:   'top top',
        end:     '8% top',
        scrub:   0.45,
      },
    })
    .to(promptTextRef.current,  { opacity: 0, y: 25, ease: 'none' }, 0)
    .to(actionButtonRef.current, { opacity: 0, y: 35, ease: 'none' }, 0);

    if (specsLeftRef.current && specsRightRef.current) {
      gsap.timeline({
        scrollTrigger: {
          trigger: '#section-specs',
          start: 'top bottom+=30%',
          end: 'center center',
          scrub: 1.55,
        }
      })
      .fromTo(specsLeftRef.current, 
        { opacity: 0, x: -70, y: 24 }, 
        { opacity: 1, x: 0, ease: 'power2.out' }, 0
      )
      .fromTo(specsRightRef.current, 
        { opacity: 0, x: 70, y: 24 }, 
        { opacity: 1, x: 0, ease: 'power2.out' }, 0
      );
    }

    if (specsHeaderRef.current && specsLeftRef.current && specsRightRef.current) {
      gsap.timeline({
        scrollTrigger: {
          trigger: '#section-specs',
          start: '70% center',
          end: 'bottom top',
          scrub: 1.35,
        },
      })
        .to(specsHeaderRef.current, { opacity: 0, y: -82, scale: 0.96, ease: 'power2.inOut' }, 0)
        .to(specsLeftRef.current, { opacity: 0.12, y: -22, ease: 'power2.inOut' }, 0.08)
        .to(specsRightRef.current, { opacity: 0.12, y: -22, ease: 'power2.inOut' }, 0.08);
    }

    gsap.timeline({
      scrollTrigger: {
        trigger: '#section-customizer',
        start:   'top center',
        end:     'top top',
        scrub:   1.25,
      },
    })
      .fromTo(customizerRef.current,  { opacity: 0, x: 50 },             { opacity: 1, x: 0 })
      .fromTo(bigSideTextRef.current, { opacity: 0, scale: 0.96, y: 15 }, { opacity: 1, scale: 1, y: 0 }, 0);

    if (canvasWrapRef.current && celestialWrapRef.current) {
      gsap.timeline({
        scrollTrigger: {
          trigger: '#section-checkout',
          start: 'top bottom',
          end: 'top center',
          scrub: 1.25,
        },
      })
        .to(canvasWrapRef.current, { opacity: 0, scale: 0.94, ease: 'power2.inOut' }, 0)
        .to(celestialWrapRef.current, { opacity: 0, ease: 'power2.inOut' }, 0);
    }
  }, [isLoading]);

  return (
    <>
      {isLoading && (
        <LoadingScreen onComplete={() => setIsLoading(false)} />
      )}

      <div ref={siteRef} style={{ opacity: 1 }}>
        <ReactLenis
          root
          options={{
            lerp: 0.078,
            wheelMultiplier: 0.76,
            touchMultiplier: 1,
            smoothWheel: true,
          }}
        >
          <FloatingNav />
          <ScrollSynchronizer />

          <div className="fixed bottom-6 left-1/2 z-[86] flex -translate-x-1/2 items-center gap-3">
            {activeSection !== 'overview' && (
              <button
                type="button"
                onClick={handlePageUp}
                aria-label="Scroll to previous page"
                className="relative grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-cyan-300/15"
              >
                <span className="absolute inset-0 rounded-full border border-cyan-300/20 opacity-70 shadow-[0_0_18px_rgba(125,211,252,0.16)]" />
                <ArrowUp size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={handlePageStep}
              aria-label="Scroll to next page"
              className="relative grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-black/55 text-white shadow-[0_18px_55px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all hover:-translate-y-1 hover:border-cyan-300/60 hover:bg-cyan-300/15"
            >
              <span className="absolute inset-0 rounded-full border border-cyan-300/20 opacity-70 shadow-[0_0_18px_rgba(125,211,252,0.16)]" />
              {isNearPageEnd ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
            </button>
          </div>

          <div className="fixed left-7 top-1/2 z-[85] hidden -translate-y-1/2 md:block">
            <span className="titan-section-indicator-active" />
            <div className="flex flex-col gap-2 pt-5">
              {SECTION_INDICATORS.map((section) => (
                <span
                  key={section.id}
                  className={`h-px rounded-full transition-opacity duration-300 ${
                    activeSection === section.id ? 'w-8 bg-white/65' : 'w-8 bg-white/35'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="fixed right-3 top-3 z-[90] flex items-center gap-2 pointer-events-auto sm:right-5 sm:top-5 sm:gap-3">
            <details className="group relative" open={activeHeaderPanel === 'search'}>
              <summary
                aria-label="Open search"
                onClick={(event) => {
                  event.preventDefault();
                  setActiveHeaderPanel((panel) => panel === 'search' ? null : 'search');
                }}
                className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-white text-black shadow-xl transition-transform hover:scale-105 sm:h-11 sm:w-11 [&::-webkit-details-marker]:hidden"
              >
                <Search size={18} strokeWidth={2.4} />
              </summary>
              <div className="absolute right-0 top-12 z-[95] w-[min(42rem,calc(100vw-1.5rem))] sm:top-14 sm:w-[min(42rem,calc(100vw-2rem))]">
                <div className="rounded-lg border border-white/10 bg-[#070707]/95 p-5 text-white shadow-2xl backdrop-blur-xl">
                  <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                    <Search className="text-amber-500" size={20} />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder="Search Titan finishes, storage, optics, delivery..."
                      className="h-12 flex-1 bg-transparent text-lg font-bold outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <div className="grid gap-3 pt-5 sm:grid-cols-2">
                    {visibleSearchItems.map((item) => (
                      <button
                        key={item.title}
                        type="button"
                        onClick={() => runSearchAction(item.action)}
                        className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-300/[0.08]"
                      >
                        <span className="block text-[10px] font-mono font-black uppercase tracking-[0.22em] text-cyan-200">{item.eyebrow}</span>
                        <span className="mt-2 block text-sm font-black text-zinc-100">{item.title}</span>
                        <span className="mt-2 block text-xs leading-5 text-zinc-500 group-hover:text-zinc-300">{item.copy}</span>
                      </button>
                    ))}
                    {visibleSearchItems.length === 0 && (
                      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-zinc-400 sm:col-span-2">
                        No Titan results. Try color, storage, camera, delivery, or checkout.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </details>

            <details className="group relative" open={activeHeaderPanel === 'cart'}>
              <summary
                aria-label="Open cart"
                onClick={(event) => {
                  event.preventDefault();
                  setActiveHeaderPanel((panel) => panel === 'cart' ? null : 'cart');
                }}
                className="relative grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-white text-black shadow-xl transition-transform hover:scale-105 sm:h-11 sm:w-11 [&::-webkit-details-marker]:hidden"
              >
                <ShoppingBag size={18} strokeWidth={2.4} />
                <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-amber-500 text-[10px] font-black text-black">
                  {cartQuantity}
                </span>
              </summary>
              <div className="absolute right-0 top-12 z-[95] w-[min(26rem,calc(100vw-1.5rem))] sm:top-14 sm:w-[min(26rem,calc(100vw-2rem))]">
                <div className="rounded-lg border border-white/10 bg-[#070707]/95 p-6 text-white shadow-2xl backdrop-blur-xl">
                  <p className="text-[10px] font-mono font-black uppercase tracking-[0.28em] text-amber-500">
                    Studio Cart
                  </p>
                  <h2 className="mt-3 text-3xl font-black uppercase tracking-tight">Configured Build</h2>
                  <div className="mt-7 rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-black uppercase text-white">Titan 17 Pro</p>
                        <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.18em] text-zinc-500">
                          {activeColorName} · {activeStorage}
                        </p>
                      </div>
                      <p className="text-lg font-black text-white">{storagePrices[activeStorage]}</p>
                    </div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-5">
                      <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">Quantity</span>
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-black text-amber-500">
                        {cartQuantity}
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">Estimated total</span>
                    <span className="text-2xl font-black text-white">{cartTotal}</span>
                  </div>
                  <button
                    type="button"
                    onClick={openCheckout}
                    className="mt-6 w-full rounded-lg bg-white px-6 py-4 text-[12px] font-mono font-black uppercase tracking-widest text-black transition-colors hover:bg-cyan-300"
                  >
                    Checkout Now
                  </button>
                  <button
                    type="button"
                    onClick={saveCurrentBuild}
                    className="mt-3 w-full rounded-lg border border-white/15 px-6 py-4 text-[12px] font-mono font-black uppercase tracking-widest text-white transition-colors hover:border-cyan-300 hover:text-cyan-200"
                  >
                    Save Build
                  </button>
                </div>
              </div>
            </details>

            <details className="group relative" open={activeHeaderPanel === 'profile'}>
              <summary
                aria-label="Open profile"
                onClick={(event) => {
                  event.preventDefault();
                  setActiveHeaderPanel((panel) => panel === 'profile' ? null : 'profile');
                }}
                className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-white text-black shadow-xl transition-transform hover:scale-105 sm:h-11 sm:w-11 [&::-webkit-details-marker]:hidden"
              >
                <User size={18} strokeWidth={2.4} />
              </summary>
              <div className="absolute right-0 top-12 z-[95] w-[min(26rem,calc(100vw-1.5rem))] sm:top-14 sm:w-[min(26rem,calc(100vw-2rem))]">
                <div className="flex max-h-[calc(100vh-5rem)] flex-col justify-between rounded-lg border border-white/10 bg-[#070707]/95 p-6 text-white shadow-2xl backdrop-blur-xl">
                  <div>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.28em] text-amber-500">
                      Titan Account
                    </p>
                    <h2 className="mt-3 text-3xl font-black uppercase tracking-tight">Studio Profile</h2>
                    <div className={`relative mt-8 overflow-hidden rounded-lg border p-5 shadow-[0_0_30px_rgba(34,211,238,0.10)] ${savedProfile ? 'border-white/10 bg-white/[0.04]' : 'border-cyan-300/35 bg-cyan-300/[0.07]'}`}>
                      {!savedProfile && (
                        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(125,211,252,0.12),transparent)]" />
                      )}
                      <div className="relative">
                        {!savedProfile && (
                          <p className="mb-3 text-[10px] font-mono font-black uppercase tracking-[0.26em] text-cyan-200">
                            Profile Required
                          </p>
                        )}
                        <p className="text-sm leading-7 text-zinc-300">
                          {savedProfile
                            ? 'Save your Titan configuration, checkout faster, and track launch-day delivery.'
                            : 'Sign up to unlock saved builds, delivery tracking, TitanCare coverage, and faster checkout.'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-5 grid gap-3">
                      <button
                        type="button"
                        onClick={() => savedProfile ? setIsSavedBuildsOpen(true) : setIsProfileSetupOpen(true)}
                        className={`group flex items-center justify-between rounded-lg border p-4 text-left text-sm font-bold transition-all hover:-translate-y-0.5 ${savedProfile ? 'border-white/10 bg-white/[0.03] text-zinc-200 hover:border-cyan-300/60 hover:bg-cyan-300/10 hover:text-white' : 'border-white/5 bg-white/[0.02] text-zinc-500'}`}
                      >
                        <span>
                          <span className="block">Saved builds</span>
                          <span className="mt-2 block text-xs font-normal leading-6 text-zinc-500 group-hover:text-cyan-100/70">
                            Save and revisit Titan configurations.
                          </span>
                        </span>
                        <ChevronRight size={17} className="text-cyan-200 opacity-70 transition-transform group-hover:translate-x-1" />
                      </button>
                      <button
                        type="button"
                        onClick={() => savedProfile ? setIsDeliveryOpen(true) : setIsProfileSetupOpen(true)}
                        className={`group flex items-center justify-between rounded-lg border p-4 text-left text-sm font-bold transition-all hover:-translate-y-0.5 ${savedProfile ? 'border-white/10 bg-white/[0.03] text-zinc-200 hover:border-cyan-300/60 hover:bg-cyan-300/10 hover:text-white' : 'border-white/5 bg-white/[0.02] text-zinc-500'}`}
                      >
                        <span>
                          <span className="block">Delivery status</span>
                          <span className="mt-2 block text-xs font-normal leading-6 text-zinc-500 group-hover:text-cyan-100/70">
                            Track production, courier prep, and delivery.
                          </span>
                        </span>
                        <ChevronRight size={17} className="text-cyan-200 opacity-70 transition-transform group-hover:translate-x-1" />
                      </button>
                      <button
                        type="button"
                        onClick={() => savedProfile ? setIsCareOpen(true) : setIsProfileSetupOpen(true)}
                        className={`group flex items-center justify-between rounded-lg border p-4 text-left text-sm font-bold transition-all hover:-translate-y-0.5 ${savedProfile ? 'border-white/10 bg-white/[0.03] text-zinc-200 hover:border-cyan-300/60 hover:bg-cyan-300/10 hover:text-white' : 'border-white/5 bg-white/[0.02] text-zinc-500'}`}
                      >
                        <span>
                          <span className="block">TitanCare coverage</span>
                          <span className="mt-2 block text-xs font-normal leading-6 text-zinc-500 group-hover:text-cyan-100/70">
                            View protection, setup, and concierge support.
                          </span>
                        </span>
                        <ChevronRight size={17} className="text-cyan-200 opacity-70 transition-transform group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProfileSetupOpen(true)}
                    className="mt-6 rounded-lg bg-white px-6 py-5 text-center text-[13px] font-mono font-black uppercase tracking-widest text-black shadow-[0_18px_55px_rgba(255,255,255,0.12)] transition-colors hover:bg-cyan-300"
                  >
                    {savedProfile ? 'Manage Profile' : 'Create Profile'}
                  </button>
                </div>
              </div>
            </details>
          </div>

          <main id="main-scroll-container" className="relative w-full bg-[#030303] text-white overflow-x-hidden font-sans">

            {/* Celestial background shader */}
            <div ref={celestialWrapRef} className="fixed inset-0 h-screen w-full pointer-events-none z-0">
              <CelestialSphere hue={210.0} speed={0.4} zoom={1.2} particleSize={4.0} />
              <div className="absolute inset-0 bg-black/40 mix-blend-multiply" />
            </div>

            {/* Fixed 3D canvas layer viewport */}
            <div ref={canvasWrapRef} className="fixed inset-0 w-full h-screen z-10 pointer-events-none">
              <Canvas
                camera={{ position: [0, 0, 5], fov: 42 }}
                dpr={[1, 1.25]}
                gl={{
                  antialias: true,
                  powerPreference: 'high-performance',
                }}
              >
                <Experience />
              </Canvas>
            </div>

            {/* 1. Hero section */}
            <section id="hero-trigger" className="relative w-full h-[150vh] z-20 pointer-events-none md:h-[160vh]">
              <div className="w-full h-screen sticky top-0 overflow-hidden px-6 py-6 md:px-10">

                <div className="absolute inset-0 flex items-center justify-center select-none">
                  <h1
                    ref={heroTitleRef}
                    className="text-[28vw] font-black tracking-tighter uppercase leading-[0.75] text-white/[0.045] mix-blend-overlay pointer-events-none md:text-[20vw]"
                  >
                    TITAN
                  </h1>
                </div>

                <button
                  type="button"
                  onClick={handleEnterLab}
                  aria-label="Explore the Titan 17 Pro limited drop"
                  className="pointer-events-auto absolute right-6 top-1/2 z-40 hidden h-[28rem] w-[4.5rem] -translate-y-1/2 flex-col items-center overflow-hidden rounded-full border border-white/15 bg-black/45 text-white shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-300 hover:border-sky-300/45 hover:bg-black/65 hover:shadow-[0_0_34px_rgba(125,211,252,0.18)] lg:flex"
                >
                  <span className="mt-2 grid h-16 w-16 place-items-center rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9),rgba(125,211,252,0.45)_38%,rgba(9,9,11,0.96)_70%)] text-[11px] font-black uppercase tracking-[0.18em] text-white shadow-[0_0_24px_rgba(125,211,252,0.2)]">
                    T17
                  </span>
                  <span className="mt-7 h-16 w-px bg-gradient-to-b from-sky-300/55 to-transparent" />
                  <span className="[writing-mode:vertical-rl] rotate-180 text-[10px] font-mono font-black uppercase tracking-[0.26em] text-sky-200/75">
                    Titan Limited Drop
                  </span>
                  <span className="mt-4 [writing-mode:vertical-rl] rotate-180 text-2xl font-black uppercase leading-none tracking-tight text-white">
                    Collection 2026
                  </span>
                  <span className="mt-auto mb-2 grid h-14 w-14 place-items-center rounded-full border border-white/20 bg-white/5 transition-colors duration-300 hover:border-sky-300">
                    <ArrowUpRight size={22} strokeWidth={2.2} />
                  </span>
                </button>

                <div className="absolute inset-x-0 bottom-6 z-30 flex flex-col items-center gap-5 px-4 sm:bottom-8 sm:gap-8 sm:px-6">
                  <div ref={promptTextRef} className="text-center">
                    <p className="text-[11px] font-mono tracking-[0.25em] text-amber-500 uppercase font-black bg-black/70 px-6 py-3 rounded-full border border-amber-500/20 shadow-2xl backdrop-blur-sm inline-block">
                      Scroll to explore
                    </p>
                  </div>

                  <div ref={actionButtonRef} className="w-full flex justify-center items-center pointer-events-auto">
                    <button
                      onClick={handleEnterLab}
                      className="rounded-2xl border border-white bg-white px-8 py-3.5 text-[10px] font-mono font-black uppercase tracking-widest text-black shadow-2xl transition-all hover:border-amber-500 hover:bg-amber-500 hover:text-white sm:px-10 sm:py-4 sm:text-[11px]"
                    >
                      Explore specs
                    </button>
                  </div>
                </div>

              </div>
            </section>

            <section className="relative w-full h-[40vh] pointer-events-none z-10" />

            {/* 2. Hardware Specs Showcase section */}
            <section
              id="section-specs"
              ref={specsSectionRef}
              className="relative z-30 flex min-h-[120vh] w-full flex-col items-center justify-center bg-transparent px-4 py-24 sm:px-6 md:px-16 lg:px-24"
            >
              <div ref={specsHeaderRef} className="absolute left-1/2 top-16 z-20 w-full max-w-5xl -translate-x-1/2 px-4 text-center pointer-events-none md:top-24 md:px-0">
                <p className="text-[10px] font-mono uppercase tracking-[0.34em] text-sky-300 font-black drop-shadow-[0_0_14px_rgba(125,211,252,0.45)]">
                  Performance Suite
                </p>
                <ScrollFloat
                  containerClassName="mx-auto mt-5 max-w-4xl"
                  textClassName="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_24px_rgba(96,165,250,0.38)]"
                  animationDuration={0.9}
                  ease="back.inOut(1.6)"
                  scrollStart="top bottom+=95%"
                  scrollEnd="top center+=8%"
                  stagger={0.012}
                >
                  Motion tuned hardware.
                </ScrollFloat>
              </div>

              <div className="relative mx-auto grid min-h-[620px] w-full max-w-7xl grid-cols-1 gap-5 pointer-events-none sm:gap-8 md:grid-cols-[minmax(230px,300px)_minmax(410px,1fr)_minmax(230px,300px)] md:items-center md:gap-x-12 lg:gap-x-16">
                {/* Left Hardware Parameters Column */}
                <div ref={specsLeftRef} className="relative z-10 flex flex-col justify-center gap-9 text-left md:self-stretch md:py-8">
                  <ElectricBorder color="#7df9ff" speed={0.75} chaos={0.07} borderRadius={8} className="w-full rounded-lg pointer-events-auto md:translate-y-4">
                    <div className="relative rounded-lg border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-md transition-colors duration-500 hover:border-sky-300/35">
                      <span className="absolute -right-16 top-1/3 hidden h-px w-14 bg-gradient-to-r from-sky-300/50 to-transparent md:block" />
                      <button
                        type="button"
                        onClick={() => setActiveSpecDetail('silicon')}
                        className="absolute right-4 top-4 z-30 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-sky-200 transition-colors hover:border-sky-200 hover:bg-sky-200 hover:text-black"
                      >
                        Detail
                      </button>
                      <p className="text-[10px] font-mono tracking-[0.3em] text-sky-300 uppercase font-black mb-2 pr-20 drop-shadow-[0_0_10px_rgba(125,211,252,0.35)]">
                        Silicon
                      </p>
                      <ScrollFloat
                        containerClassName="max-w-xs"
                        textClassName="whitespace-nowrap text-3xl md:text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_18px_rgba(96,165,250,0.24)]"
                        animationDuration={0.7}
                        scrollStart="top bottom-=5%"
                        scrollEnd="center center+=15%"
                        stagger={0.01}
                      >
                        A18 Bionic
                      </ScrollFloat>
                      <div className="mt-3 w-8 h-0.5 bg-zinc-800" />
                      <p className="text-sm text-zinc-400 mt-4 max-w-xs leading-relaxed">
                        A 3nm neural graphics engine keeps the product interface fast, cinematic, and stable under load.
                      </p>
                    </div>
                  </ElectricBorder>

                  <ElectricBorder color="#7df9ff" speed={0.72} chaos={0.07} borderRadius={8} className="w-full rounded-lg pointer-events-auto md:translate-y-14">
                    <div className="relative rounded-lg border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-md transition-colors duration-500 hover:border-sky-300/35">
                      <span className="absolute -right-20 top-[24%] hidden h-px w-16 bg-gradient-to-r from-sky-300/45 to-transparent md:block" />
                      <button
                        type="button"
                        onClick={() => setActiveSpecDetail('optics')}
                        className="absolute right-4 top-4 z-30 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-sky-200 transition-colors hover:border-sky-200 hover:bg-sky-200 hover:text-black"
                      >
                        Detail
                      </button>
                      <p className="text-[10px] font-mono tracking-[0.3em] text-sky-300 uppercase font-black mb-2 pr-20 drop-shadow-[0_0_10px_rgba(125,211,252,0.35)]">
                        Optics
                      </p>
                      <ScrollFloat
                        containerClassName="max-w-xs"
                        textClassName="whitespace-nowrap text-3xl md:text-[2rem] lg:text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_18px_rgba(96,165,250,0.24)]"
                        animationDuration={0.7}
                        scrollStart="top bottom-=5%"
                        scrollEnd="center center+=15%"
                        stagger={0.01}
                      >
                        Fusion 48MP
                      </ScrollFloat>
                      <div className="mt-3 w-8 h-0.5 bg-zinc-800" />
                      <p className="text-sm text-zinc-400 mt-4 max-w-xs leading-relaxed">
                        Fluorite coating and sensor-shift stabilization tune every frame before it reaches the display.
                      </p>
                    </div>
                  </ElectricBorder>
                </div>

                {/* Center Column Spacer */}
                <div className="hidden min-h-[38rem] md:block" />

                {/* Right Hardware Parameters Column */}
                <div ref={specsRightRef} className="relative z-10 flex flex-col justify-center gap-9 text-left md:items-end md:self-stretch md:py-8 md:text-right">
                  <ElectricBorder color="#7df9ff" speed={0.7} chaos={0.07} borderRadius={8} className="w-full rounded-lg pointer-events-auto md:translate-y-3">
                    <div className="relative rounded-lg border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-md transition-colors duration-500 hover:border-sky-300/35">
                      <span className="absolute -left-20 top-[42%] hidden h-px w-16 bg-gradient-to-l from-sky-300/50 to-transparent md:block" />
                      <button
                        type="button"
                        onClick={() => setActiveSpecDetail('metallurgy')}
                        className="absolute left-4 top-4 z-30 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-sky-200 transition-colors hover:border-sky-200 hover:bg-sky-200 hover:text-black md:left-auto md:right-4"
                      >
                        Detail
                      </button>
                      <p className="text-[10px] font-mono tracking-[0.3em] text-sky-300 uppercase font-black mb-2 pl-20 md:pl-0 md:pr-20 md:text-right drop-shadow-[0_0_10px_rgba(125,211,252,0.35)]">
                        Metallurgy
                      </p>
                      <ScrollFloat
                        containerClassName="max-w-xs md:ml-auto"
                        textClassName="whitespace-nowrap text-3xl md:text-[2rem] lg:text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_18px_rgba(96,165,250,0.24)]"
                        animationDuration={0.7}
                        scrollStart="top bottom-=5%"
                        scrollEnd="center center+=15%"
                        stagger={0.01}
                      >
                        Titanium G5
                      </ScrollFloat>
                      <div className="mt-3 w-8 h-0.5 bg-zinc-800 md:ml-auto" />
                      <p className="text-sm text-zinc-400 mt-4 max-w-xs leading-relaxed md:text-right">
                        Grade 5 titanium keeps the body rigid, light, and tuned for a precise hand feel.
                      </p>
                    </div>
                  </ElectricBorder>

                  <ElectricBorder color="#7df9ff" speed={0.74} chaos={0.07} borderRadius={8} className="mt-auto w-full rounded-lg pointer-events-auto md:-translate-y-1">
                    <div className="relative rounded-lg border border-white/10 bg-black/40 p-5 shadow-2xl backdrop-blur-md transition-colors duration-500 hover:border-sky-300/35">
                      <span className="absolute -left-20 top-[34%] hidden h-px w-16 bg-gradient-to-l from-sky-300/45 to-transparent md:block" />
                      <button
                        type="button"
                        onClick={() => setActiveSpecDetail('display')}
                        className="absolute left-4 top-4 z-30 rounded-full border border-sky-300/25 bg-sky-300/10 px-3 py-1.5 text-[9px] font-mono font-black uppercase tracking-[0.2em] text-sky-200 transition-colors hover:border-sky-200 hover:bg-sky-200 hover:text-black md:left-auto md:right-4"
                      >
                        Detail
                      </button>
                      <p className="text-[10px] font-mono tracking-[0.3em] text-sky-300 uppercase font-black mb-2 pl-20 md:pl-0 md:pr-20 md:text-right drop-shadow-[0_0_10px_rgba(125,211,252,0.35)]">
                        Display
                      </p>
                      <ScrollFloat
                        containerClassName="max-w-xs md:ml-auto"
                        textClassName="whitespace-nowrap text-3xl md:text-4xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_18px_rgba(96,165,250,0.24)]"
                        animationDuration={0.7}
                        scrollStart="top bottom-=5%"
                        scrollEnd="center center+=15%"
                        stagger={0.01}
                      >
                        120Hz XDR
                      </ScrollFloat>
                      <div className="mt-3 w-8 h-0.5 bg-zinc-800 md:ml-auto" />
                      <p className="text-sm text-zinc-400 mt-4 max-w-xs leading-relaxed md:text-right">
                        Adaptive refresh responds to touch, scroll, video, and idle states with studio-grade smoothness.
                      </p>
                    </div>
                  </ElectricBorder>
                </div>

              </div>
            </section>

            {/* 3. Customizer section */}
            <section
              id="section-customizer"
              className="relative w-full min-h-screen flex flex-col lg:flex-row items-center justify-between px-5 py-20 sm:px-8 md:px-16 lg:px-24 lg:py-24 z-30 gap-10 lg:gap-12"
            >
              <div className="w-full lg:w-auto text-left lg:max-w-sm select-none pointer-events-none">
                <p className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase font-black mb-3">
                  Configuration Studio
                </p>
                    <h3
                  ref={bigSideTextRef}
                  className="text-4xl sm:text-5xl md:text-6xl lg:text-[4vw] font-black tracking-tight text-white leading-none uppercase"
                >
                  TITAN<br />17 PRO
                </h3>
                <div className="mt-6 w-12 h-px bg-amber-500" />
                <p className="font-mono text-[10px] tracking-widest text-zinc-500 mt-4 uppercase leading-relaxed">
                  Tune finish, capacity, and scale before reserving.
                </p>
                <div className="mt-9 grid grid-cols-3 gap-3">
                  {precisionStats.map((stat) => (
                    <div key={stat.value} className="border-t border-white/10 pt-3">
                      <p className="text-lg font-black text-white tracking-tight">{stat.value}</p>
                      <p className="mt-1 text-[9px] font-mono uppercase tracking-[0.18em] leading-relaxed text-zinc-500">
                        {stat.label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div
                ref={customizerRef}
                className="w-full max-w-md bg-[#070707]/95 backdrop-blur-2xl border border-white/10 p-7 rounded-lg shadow-2xl pointer-events-auto lg:ml-auto"
              >
                <div className="flex justify-between items-center mb-7 pb-4 border-b border-zinc-800/80">
                  <span className="text-[10px] font-mono tracking-widest text-amber-500 font-black uppercase">
                    Titan Studio
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500 font-bold">{storagePrices[activeStorage]}</span>
                </div>

                <div className="mb-7 flex items-end justify-between gap-5">
                  <div>
                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">
                      Bespoke Build
                    </h2>
                    <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-zinc-500">
                      {activeColorName} · {activeStorage}
                    </p>
                  </div>
                  <div className="h-12 w-12 border border-amber-500/30 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <span className="text-[10px] font-mono font-black text-amber-500">17</span>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] block font-black">
                      Finish
                    </label>
                    <button
                      onClick={() => setFrameColor(null)}
                      className={`text-[10px] font-mono transition-colors duration-200 uppercase tracking-wider underline underline-offset-4 font-bold ${
                        currentColor === null ? 'text-amber-500' : 'text-zinc-400 hover:text-amber-500'
                      }`}
                    >
                      Restore original
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2.5">
                    <button
                      onClick={() => setFrameColor(null)}
                      className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all duration-200 ${
                        currentColor === null
                          ? 'border-amber-500 bg-zinc-800/80 shadow-lg shadow-amber-500/10'
                          : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
                      }`}
                    >
                      <span className="w-5 h-5 rounded-full border border-white/15 bg-gradient-to-br from-zinc-200 via-zinc-500 to-zinc-950 flex-shrink-0" />
                      <span className="text-[11px] font-mono text-zinc-200 font-black tracking-wide">
                        ORIGINAL COLOR
                      </span>
                    </button>
                    {colorOptions.map((color) => (
                      <button
                        key={color.name}
                        onClick={() => setFrameColor(color.value)}
                        className={`flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all duration-200 ${
                          currentColor === color.value
                            ? 'border-amber-500 bg-zinc-800/80 shadow-lg shadow-amber-500/10'
                            : 'border-zinc-800 bg-zinc-900/50 hover:border-zinc-600 hover:bg-zinc-800/50'
                        }`}
                      >
                        <span
                          className="w-5 h-5 rounded-full border border-white/10 flex-shrink-0"
                          style={{ backgroundColor: color.value }}
                        />
                        <span className="text-[11px] font-mono text-zinc-200 font-black tracking-wide">
                          {color.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-6 bg-zinc-900/40 border border-zinc-800/60 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] font-black">
                      Display scale
                    </label>
                    <span className="text-[11px] font-mono text-amber-500 font-black">
                      {Math.round(modelScale * 100)}%
                    </span>
                  </div>
                  <input
                    type="range" min="0.75" max="1" step="0.01"
                    value={modelScale}
                    onChange={(e) => setModelScale(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-full appearance-none cursor-pointer accent-amber-500"
                  />
                </div>

                <div className="mb-7">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em] block font-black mb-3">
                    Storage
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {storageOptions.map((size) => (
                      <button
                        key={size}
                        onClick={() => setActiveStorage(size)}
                        className={`py-3.5 text-center rounded-lg font-mono text-[11px] font-black transition-all duration-200 border ${
                          activeStorage === size
                            ? 'border-amber-500 bg-white text-black shadow-lg'
                            : 'border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:border-zinc-600 hover:text-white'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={openCheckout}
                  className="w-full py-4 bg-white text-black hover:bg-amber-500 active:scale-[0.99] transition-all duration-200 rounded-lg font-black uppercase tracking-widest text-[12px] font-mono shadow-xl"
                >
                  Lock In Configuration →
                </button>
              </div>
            </section>

            <section
              id="section-craft"
              className="relative z-30 w-full px-8 md:px-16 lg:px-24 py-28 bg-[#050505]/90 border-y border-white/10"
            >
              <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.4fr] lg:items-end">
                <div>
                  <p className="text-[10px] font-mono tracking-[0.3em] text-amber-500 uppercase font-black mb-4">
                    Engineering
                  </p>
                  <h2 className="max-w-xl text-5xl md:text-7xl font-black uppercase tracking-tight leading-[0.88] text-white">
                    Built like a private instrument.
                  </h2>
                </div>
                <p className="max-w-2xl text-base md:text-lg leading-8 text-zinc-400 lg:justify-self-end">
                  TITAN is presented as a precision object: configurable, cinematic, and deliberately quiet until the details matter. Every interaction is tuned to keep the phone at the center of the store.
                </p>
              </div>

              <div className="mx-auto mt-16 grid w-full max-w-7xl grid-cols-1 gap-4 md:grid-cols-3">
                {craftPanels.map((panel) => (
                  <article
                    key={panel.title}
                    className="group min-h-64 border border-white/10 bg-white/[0.035] p-6 rounded-lg transition-all duration-500 hover:-translate-y-1 hover:border-amber-500/50 hover:bg-white/[0.06]"
                  >
                    <div className="mb-12 flex items-center justify-between">
                      <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-amber-500 font-black">
                        {panel.eyebrow}
                      </p>
                      <span className="h-2 w-2 rounded-full bg-zinc-700 transition-colors duration-500 group-hover:bg-amber-500" />
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tight text-white">
                      {panel.title}
                    </h3>
                    <p className="mt-5 text-sm leading-7 text-zinc-400">
                      {panel.copy}
                    </p>
                  </article>
                ))}
              </div>
            </section>

            <section
              id="section-checkout"
              className="relative z-30 flex min-h-screen w-full items-center overflow-hidden px-8 py-20 md:px-16 lg:px-24 bg-black"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(56,189,248,0.08),transparent_34%),linear-gradient(180deg,rgba(0,0,0,0),#000)]" />
              <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-stretch">
                <div className="flex min-h-[520px] flex-col justify-between border border-white/10 bg-black/85 p-7 md:p-10 rounded-lg">
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                    <div>
                      <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500 font-black">
                        Reserve
                      </p>
                      <h2 className="mt-4 text-4xl md:text-6xl font-black uppercase tracking-tight text-white">
                        Titan 17 Pro
                      </h2>
                    </div>
                    <p className="text-4xl font-black text-white">{storagePrices[activeStorage]}</p>
                  </div>

                  <div className="grid gap-4 py-10 md:grid-cols-2">
                    <div className="border border-white/10 p-5 rounded-lg">
                      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-black">
                        Finish
                      </p>
                      <p className="mt-3 text-xl font-black uppercase text-white">{activeColorName}</p>
                    </div>
                    <div className="border border-white/10 p-5 rounded-lg">
                      <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-zinc-500 font-black">
                        Capacity
                      </p>
                      <p className="mt-3 text-xl font-black uppercase text-white">{activeStorage}</p>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {checkoutPerks.map((perk) => (
                      <div key={perk} className="flex items-center gap-3 text-sm text-zinc-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                        {perk}
                      </div>
                    ))}
                  </div>

                  <div className="mt-10 flex flex-col gap-3 sm:flex-row">
                    <button
                      onClick={openCheckout}
                      className="flex-1 rounded-lg bg-white px-6 py-4 text-[12px] font-mono font-black uppercase tracking-widest text-black transition-colors hover:bg-amber-500"
                    >
                      Reserve Build
                    </button>
                    <details className="group relative flex-1">
                      <summary className="block cursor-pointer list-none rounded-lg border border-white/15 px-6 py-4 text-center text-[12px] font-mono font-black uppercase tracking-widest text-white transition-colors hover:border-amber-500 hover:text-amber-500 [&::-webkit-details-marker]:hidden">
                        Compare Specs
                      </summary>
                      <div className="absolute bottom-full right-0 z-[70] mb-4 w-[min(48rem,calc(100vw-4rem))] rounded-lg border border-white/10 bg-[#070707]/95 p-5 text-left shadow-2xl backdrop-blur-xl">
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-amber-500">
                          Compare Specs
                        </p>
                        <h3 className="mt-3 text-3xl font-black uppercase tracking-tight text-white">
                          Titan 17 Pro
                        </h3>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2">
                          {[
                            ['Chip', 'A18 Bionic', '3nm neural graphics'],
                            ['Camera', 'Fusion 48MP', 'Stabilized optic matrix'],
                            ['Display', '120Hz XDR', 'Adaptive LTPO canvas'],
                            ['Frame', 'Titanium G5', 'Aerospace alloy shell'],
                          ].map(([label, value, note]) => (
                            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                              <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                              <p className="mt-3 text-xl font-black uppercase text-white">{value}</p>
                              <p className="mt-2 text-sm leading-6 text-zinc-400">{note}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>
                </div>

                <aside className="border border-sky-300/20 bg-sky-300/[0.045] p-7 md:p-10 rounded-lg">
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-500 font-black">
                    Studio Signal
                  </p>
                  <h3 className="mt-8 text-4xl font-black uppercase tracking-tight text-white">
                    The store should feel as engineered as the phone.
                  </h3>
                  <p className="mt-6 text-sm leading-7 text-zinc-300">
                    This build now keeps product behavior in the model layer, pricing in the interface layer, and scroll choreography isolated from the rest of the page so future sections can grow without breaking the phone motion.
                  </p>
                  <div className="mt-10 border-t border-white/10 pt-6">
                    <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                      Current selection
                    </p>
                    <p className="mt-3 text-2xl font-black text-white">
                      {activeColorName} · {activeStorage} · {Math.round(modelScale * 100)}%
                    </p>
                  </div>
                </aside>
              </div>
            </section>

            <footer className="relative z-30 border-t border-white/10 bg-black px-8 py-12 md:px-16 lg:px-24">
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
              <div className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1fr_1.1fr_0.8fr] lg:items-start">
                <div>
                  <p className="text-xl font-black uppercase tracking-tight text-white">TITAN</p>
                  <p className="mt-2 text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">
                    Premium 3D phone store
                  </p>
                  <p className="mt-5 text-xs font-bold leading-6 text-zinc-500">
                    Copyright 2026 TITAN Studio. All rights reserved. Product visuals, configuration UI, and checkout previews are prototype store assets.
                  </p>
                </div>
                <div>
                  <div className="flex flex-wrap gap-5 text-[10px] font-mono font-black uppercase tracking-[0.22em] text-zinc-500">
                    <a href="#section-customizer" className="transition-colors hover:text-white">Configure</a>
                    <a href="#section-specs" className="transition-colors hover:text-white">Specs</a>
                    <a href="#section-checkout" className="transition-colors hover:text-white">Reserve</a>
                  </div>
                  <details className="mt-6 rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm text-zinc-400">
                    <summary className="cursor-pointer list-none text-[10px] font-mono font-black uppercase tracking-[0.24em] text-cyan-200 [&::-webkit-details-marker]:hidden">
                      Privacy Policy
                    </summary>
                    <p className="mt-4 leading-7">
                      TITAN only uses profile, build, cart, and delivery details inside this demo experience to personalize saved builds, checkout previews, and account panels. No payment is processed here. When backend checkout is connected, payment and shipping data should be handled by the selected provider under encrypted transport and used only to complete the order, support delivery, and provide TitanCare service.
                    </p>
                  </details>
                </div>
                <a
                  href="https://zacharyhutton.online/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="justify-self-start rounded-full border border-amber-500/35 bg-amber-500/10 px-6 py-4 text-base font-black uppercase tracking-[0.18em] text-zinc-100 shadow-[0_0_34px_rgba(245,158,11,0.14)] transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:text-amber-300 lg:justify-self-end"
                >
                  Website by <span className="text-amber-500">Zachary Hutton</span>
                </a>
              </div>
            </footer>

          </main>
        </ReactLenis>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] bg-black/70 p-4 backdrop-blur-xl md:p-8"
            >
              <motion.div
                initial={{ opacity: 0, y: -18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -18 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="mx-auto mt-14 max-w-3xl rounded-lg border border-white/10 bg-[#070707] p-5 text-white shadow-2xl"
              >
                <div className="flex items-center gap-4 border-b border-white/10 pb-4">
                  <Search className="text-amber-500" size={20} />
                  <input
                    autoFocus
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search Titan finishes, storage, optics, delivery..."
                    className="h-12 flex-1 bg-transparent text-lg font-bold outline-none placeholder:text-zinc-600"
                  />
                  <button
                    onClick={() => setIsSearchOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white text-black"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="grid gap-3 pt-5 sm:grid-cols-2">
                  {visibleSearchItems.map((item) => (
                    <button
                      key={item.title}
                      type="button"
                      onClick={() => runSearchAction(item.action)}
                      className="group rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left transition-all hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-300/[0.08]"
                    >
                      <span className="block text-[10px] font-mono font-black uppercase tracking-[0.22em] text-cyan-200">{item.eyebrow}</span>
                      <span className="mt-2 block text-sm font-black text-zinc-100">{item.title}</span>
                      <span className="mt-2 block text-xs leading-5 text-zinc-500 group-hover:text-zinc-300">{item.copy}</span>
                    </button>
                  ))}
                  {visibleSearchItems.length === 0 && (
                    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4 text-sm font-bold text-zinc-400 sm:col-span-2">
                      No Titan results. Try color, storage, camera, delivery, or checkout.
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProfileOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[95] bg-black/60 p-4 backdrop-blur-xl md:p-8"
            >
              <motion.div
                initial={{ opacity: 0, x: 36 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 36 }}
                transition={{ duration: 0.32, ease: 'easeOut' }}
                className="ml-auto flex h-full max-w-md flex-col justify-between rounded-lg border border-white/10 bg-[#070707] p-6 text-white shadow-2xl"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-black uppercase tracking-[0.28em] text-amber-500">
                        Titan Account
                      </p>
                      <h2 className="mt-3 text-3xl font-black uppercase tracking-tight">Studio Profile</h2>
                    </div>
                    <button
                      onClick={() => setIsProfileOpen(false)}
                      className="grid h-10 w-10 place-items-center rounded-full bg-white text-black"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-5">
                    <p className="text-sm leading-7 text-zinc-300">
                      Sign in to save your Titan configuration, checkout faster, and track launch-day delivery.
                    </p>
                  </div>

                  <div className="mt-5 grid gap-3">
                    <button
                      type="button"
                      onClick={() => savedProfile ? setIsSavedBuildsOpen(true) : setIsProfileSetupOpen(true)}
                      className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-white"
                    >
                      Saved builds <ChevronRight size={17} className="text-cyan-200 transition-transform group-hover:translate-x-1" />
                    </button>
                    <button
                      type="button"
                      onClick={() => savedProfile ? setIsDeliveryOpen(true) : setIsProfileSetupOpen(true)}
                      className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-white"
                    >
                      Delivery status <ChevronRight size={17} className="text-cyan-200 transition-transform group-hover:translate-x-1" />
                    </button>
                    <button
                      type="button"
                      onClick={() => savedProfile ? setIsCareOpen(true) : setIsProfileSetupOpen(true)}
                      className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] p-4 text-left text-sm font-bold text-zinc-200 hover:border-cyan-300 hover:text-white"
                    >
                      TitanCare coverage <ChevronRight size={17} className="text-cyan-200 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsProfileSetupOpen(true)}
                  className="rounded-lg bg-white px-6 py-4 text-[12px] font-mono font-black uppercase tracking-widest text-black transition-colors hover:bg-amber-500"
                >
                  {savedProfile ? 'Manage Profile' : 'Create Profile'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCompareOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[96] bg-black/70 p-4 backdrop-blur-xl md:p-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="mx-auto mt-10 max-w-5xl rounded-lg border border-white/10 bg-[#070707] p-6 text-white shadow-2xl md:p-8"
              >
                <div className="flex items-start justify-between gap-6 border-b border-white/10 pb-6">
                  <div>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.3em] text-amber-500">
                      Compare Specs
                    </p>
                    <h2 className="mt-3 text-4xl font-black uppercase tracking-tight">Titan 17 Pro</h2>
                  </div>
                  <button
                    onClick={() => setIsCompareOpen(false)}
                    className="grid h-10 w-10 place-items-center rounded-full bg-white text-black"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="mt-8 grid gap-4 md:grid-cols-4">
                  {[
                    ['Chip', 'A18 Bionic', '3nm neural graphics'],
                    ['Camera', 'Fusion 48MP', 'Stabilized optic matrix'],
                    ['Display', '120Hz XDR', 'Adaptive LTPO canvas'],
                    ['Frame', 'Titanium G5', 'Aerospace alloy shell'],
                  ].map(([label, value, note]) => (
                    <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                      <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">{label}</p>
                      <p className="mt-4 text-2xl font-black uppercase text-white">{value}</p>
                      <p className="mt-3 text-sm leading-6 text-zinc-400">{note}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeSpec && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[97] flex items-center justify-center bg-black/55 p-3 backdrop-blur-xl sm:p-4"
            >
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-sky-300/20 bg-[#050709] text-white shadow-[0_30px_120px_rgba(56,189,248,0.14)]"
              >
                <div className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${activeSpec.accent}`} />
                <button
                  type="button"
                  onClick={() => setActiveSpecDetail(null)}
                  className="absolute right-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105"
                  aria-label="Close spec detail"
                >
                  <X size={16} />
                </button>

                <div className="grid gap-0 md:grid-cols-[0.95fr_1.05fr]">
                  <div className="relative min-h-[250px] overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_50%_35%,rgba(125,211,252,0.16),transparent_42%),linear-gradient(145deg,rgba(255,255,255,0.06),transparent)] p-5 sm:min-h-[290px] sm:p-6 md:border-b-0 md:border-r">
                    <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(125,211,252,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(125,211,252,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
                    <div className="relative flex h-full min-h-[240px] items-center justify-center">
                      {activeSpec.part === 'camera-array' && (
                        <div className="relative h-56 w-48 rounded-[2rem] border border-white/15 bg-gradient-to-br from-slate-50 via-slate-300 to-slate-700 shadow-[0_30px_90px_rgba(125,211,252,0.18)]">
                          <span className="absolute left-8 top-8 h-16 w-16 rounded-full border-[10px] border-slate-200 bg-black shadow-inner" />
                          <span className="absolute right-8 top-16 h-14 w-14 rounded-full border-[9px] border-slate-200 bg-black shadow-inner" />
                          <span className="absolute left-10 bottom-9 h-15 w-15 rounded-full border-[9px] border-slate-200 bg-black shadow-inner" />
                          <span className="absolute right-8 bottom-12 h-5 w-5 rounded-full bg-zinc-500" />
                        </div>
                      )}
                      {activeSpec.part === 'logic-core' && (
                        <div className="relative h-44 w-44 rounded-2xl border border-cyan-200/40 bg-gradient-to-br from-cyan-300/25 via-sky-950 to-black p-4 shadow-[0_0_70px_rgba(125,211,252,0.24)]">
                          <div className="h-full w-full rounded-xl border border-cyan-200/30 bg-black/50 p-5">
                            <p className="text-center text-4xl font-black tracking-tight text-white">A18</p>
                            <p className="mt-2 text-center text-[10px] font-mono uppercase tracking-[0.24em] text-cyan-200">Bionic</p>
                          </div>
                          <span className="absolute -left-8 top-1/2 h-px w-8 bg-cyan-200/60" />
                          <span className="absolute -right-8 top-1/2 h-px w-8 bg-cyan-200/60" />
                        </div>
                      )}
                      {activeSpec.part === 'frame-rail' && (
                        <div className="relative h-64 w-28 rounded-[2.5rem] border border-white/20 bg-gradient-to-r from-slate-900 via-slate-100 to-slate-700 shadow-[0_30px_100px_rgba(148,163,184,0.18)]">
                          <span className="absolute left-1/2 top-14 h-20 w-3 -translate-x-1/2 rounded-full border border-white/40 bg-white/20" />
                          <span className="absolute left-1/2 bottom-14 h-16 w-4 -translate-x-1/2 rounded-full border border-white/40 bg-white/20" />
                        </div>
                      )}
                      {activeSpec.part === 'display-stack' && (
                        <div className="relative h-64 w-36 rounded-[2rem] border border-cyan-100/30 bg-black p-2 shadow-[0_30px_100px_rgba(45,212,191,0.16)]">
                          <div className="h-full w-full overflow-hidden rounded-[1.65rem] bg-[radial-gradient(circle_at_50%_24%,#a7fff2,transparent_25%),radial-gradient(circle_at_50%_72%,#2dd4bf,transparent_34%),linear-gradient(180deg,#020617,#0f766e)]" />
                          <span className="absolute left-1/2 top-6 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 sm:p-6 md:p-7">
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-sky-300">
                      {activeSpec.eyebrow}
                    </p>
                    <h2 className="mt-4 text-4xl font-black uppercase tracking-tight text-white">
                      {activeSpec.title}
                    </h2>
                    <p className="mt-5 text-sm leading-7 text-zinc-300">
                      {activeSpec.detail}
                    </p>
                    <div className="mt-7 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">
                        Focus point
                      </p>
                      <p className="mt-3 text-lg font-black uppercase text-white">
                        {activeSpec.callout}
                      </p>
                    </div>
                    <div className="mt-4 grid gap-2 sm:grid-cols-3">
                      {activeSpec.metrics.map((metric) => (
                        <div key={metric} className="rounded-lg border border-sky-300/10 bg-sky-300/[0.04] p-3">
                          <p className="text-[9px] font-mono font-black uppercase tracking-[0.22em] text-sky-200">Signal</p>
                          <p className="mt-2 text-xs font-black uppercase leading-5 text-white">{metric}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">Studio note</p>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">{activeSpec.deepDive}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSavedBuildsOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/72 p-4 backdrop-blur-xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="relative max-h-[90vh] w-full max-w-6xl overflow-hidden rounded-lg border border-white/10 bg-[#050505] text-white shadow-2xl"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_10%,rgba(125,211,252,0.16),transparent_32%),linear-gradient(135deg,rgba(255,255,255,0.05),transparent_45%)]" />
                <button
                  type="button"
                  onClick={() => setIsSavedBuildsOpen(false)}
                  className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-black"
                  aria-label="Close saved builds"
                >
                  <X size={16} />
                </button>
                <div className="relative z-10 grid gap-7 p-6 md:grid-cols-[0.7fr_1.3fr] md:p-8">
                  <div>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-cyan-200">Titan Vault</p>
                    <h2 className="mt-4 text-5xl font-black uppercase tracking-tight">Saved Builds</h2>
                    <p className="mt-5 text-sm leading-7 text-zinc-400">
                      Save a Titan configuration to your profile, compare it later, edit the Lab setup, or send it straight to checkout.
                    </p>
                    <div className="mt-7 grid gap-3">
                      {[
                        ['1', 'Save', 'Capture the current finish, storage, and scale.'],
                        ['2', 'Review', 'See the build card with color-matched preview and total.'],
                        ['3', 'Act', 'Checkout, edit in Lab, or remove old builds.'],
                      ].map(([step, title, copy]) => (
                        <div key={step} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
                          <div className="flex items-start gap-3">
                            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-cyan-300 text-xs font-black text-black">{step}</span>
                            <div>
                              <p className="text-sm font-black uppercase text-white">{title}</p>
                              <p className="mt-1 text-xs leading-5 text-zinc-500">{copy}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={saveCurrentBuild}
                      className="mt-7 inline-flex w-full items-center justify-center gap-3 rounded-lg bg-white px-5 py-4 text-[11px] font-mono font-black uppercase tracking-widest text-black transition-colors hover:bg-cyan-300"
                    >
                      <Save size={15} /> Save Current Build
                    </button>
                  </div>
                  <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-2">
                    {(savedBuilds.length ? savedBuilds : [{
                      id: 'PREVIEW',
                      finish: activeColorName,
                      color: checkoutFinishColor,
                      storage: activeStorage,
                      scale: Math.round(modelScale * 100),
                      total: cartTotal,
                      profileEmail: savedProfile?.email ?? 'preview',
                    }]).map((build) => {
                      const showFullBuild = savedBuilds.length <= 4 || expandedSavedBuildId === build.id || build.id === 'PREVIEW';

                      return (
                      <div key={build.id} className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] p-5 transition-all hover:-translate-y-0.5 hover:border-cyan-300/50 hover:bg-cyan-300/[0.08] sm:p-6">
                        <div className="absolute inset-y-0 left-0 w-1 bg-cyan-300/70 opacity-0 transition-opacity group-hover:opacity-100" />
                        {build.id === 'PREVIEW' && (
                          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs font-bold leading-5 text-amber-100">
                            Preview only. Press Save Current Build to attach this configuration to your profile.
                          </div>
                        )}
                        <div className="flex items-start gap-4 sm:gap-5">
                          <div
                            className="relative h-24 w-16 shrink-0 rounded-2xl border border-white/15 shadow-[0_16px_60px_rgba(125,211,252,0.14)]"
                            style={{ background: `linear-gradient(135deg, #ffffff, ${build.color}, #111827)` }}
                          >
                            <span className="absolute left-3 top-3 h-4 w-4 rounded-full bg-black" />
                            <span className="absolute right-3 top-4 h-4 w-4 rounded-full bg-black" />
                            <span className="absolute left-3 top-10 h-4 w-4 rounded-full bg-black" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[10px] font-mono uppercase tracking-[0.28em] text-zinc-500">{build.id}</p>
                            <h3 className="mt-3 text-2xl font-black uppercase">Titan 17 Pro</h3>
                            <p className="mt-2 text-sm font-bold uppercase text-zinc-400">{build.finish} · {build.storage} · {build.scale}%</p>
                            {showFullBuild && (
                            <div className="mt-4 grid gap-2 sm:grid-cols-3">
                              {[
                                ['Finish', build.finish],
                                ['Storage', build.storage],
                                ['Scale', `${build.scale}%`],
                              ].map(([label, value]) => (
                                <div key={label} className="rounded-md border border-white/10 bg-black/30 px-3 py-2">
                                  <p className="text-[9px] font-mono uppercase tracking-[0.22em] text-zinc-500">{label}</p>
                                  <p className="mt-1 truncate text-xs font-black uppercase text-white">{value}</p>
                                </div>
                              ))}
                            </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black">{build.total}</p>
                            {savedBuilds.length > 4 && build.id !== 'PREVIEW' && (
                              <button
                                type="button"
                                onClick={() => setExpandedSavedBuildId((id) => id === build.id ? null : build.id)}
                                className="mt-3 rounded-full border border-cyan-300/25 px-3 py-2 text-[10px] font-mono font-black uppercase tracking-widest text-cyan-200 hover:border-cyan-200 hover:bg-cyan-200 hover:text-black"
                              >
                                {showFullBuild ? 'Collapse' : 'Details'}
                              </button>
                            )}
                            {showFullBuild && build.id !== 'PREVIEW' && (
                              <button
                                type="button"
                                onClick={() => setSavedBuilds((builds) => builds.filter((saved) => saved.id !== build.id))}
                                className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 hover:border-red-400/60 hover:text-red-300"
                              >
                                <Trash2 size={13} /> Remove
                              </button>
                            )}
                          </div>
                        </div>
                        {showFullBuild && (
                        <div className="mt-5 flex gap-3">
                          <button
                            type="button"
                            onClick={openCheckout}
                            className="flex-1 rounded-lg bg-white px-4 py-3 text-[10px] font-mono font-black uppercase tracking-widest text-black hover:bg-cyan-300"
                          >
                            Checkout
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSavedBuildsOpen(false);
                              lenis?.scrollTo('#section-customizer', { duration: 1, easing: (t: number) => 1 - Math.pow(1 - t, 4) });
                            }}
                            className="flex-1 rounded-lg border border-white/15 px-4 py-3 text-[10px] font-mono font-black uppercase tracking-widest text-white hover:border-cyan-300"
                          >
                            Edit
                          </button>
                        </div>
                        )}
                      </div>
                    );
                    })}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCareOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/75 p-4 backdrop-blur-xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-cyan-200/15 bg-[#05070a] p-6 text-white shadow-[0_30px_120px_rgba(34,211,238,0.12)] md:p-8"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(34,211,238,0.16),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.06),transparent_48%)]" />
                <button
                  type="button"
                  onClick={() => setIsCareOpen(false)}
                  className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-black"
                  aria-label="Close TitanCare"
                >
                  <X size={16} />
                </button>
                <div className="relative z-10 grid gap-8 md:grid-cols-[0.9fr_1.1fr]">
                  <div className="flex min-h-[330px] items-center justify-center">
                    <motion.div
                      animate={{ rotateY: [0, 360], y: [0, -8, 0] }}
                      transition={{ rotateY: { duration: 5, repeat: Infinity, ease: 'linear' }, y: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } }}
                      className="grid h-48 w-48 place-items-center rounded-[2rem] border border-cyan-200/30 bg-cyan-200/10 shadow-[0_0_90px_rgba(34,211,238,0.18)]"
                    >
                      <Shield size={96} strokeWidth={1.2} className="text-cyan-200 drop-shadow-[0_0_24px_rgba(125,211,252,0.45)]" />
                    </motion.div>
                  </div>
                  <div>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-cyan-200">TitanCare</p>
                    <h2 className="mt-4 text-5xl font-black uppercase tracking-tight">Coverage Built For Launch Day</h2>
                    <p className="mt-5 text-sm leading-7 text-zinc-300">
                      TitanCare protects the device, supports the setup, and keeps delivery support close from reservation through first use.
                    </p>
                    <div className="mt-8 grid gap-3">
                      {['Priority replacement support', 'White-glove data transfer', '14-day studio trial', 'Launch courier tracking'].map((item) => (
                        <div key={item} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4">
                          <Check size={16} className="text-cyan-200" />
                          <span className="text-sm font-bold text-zinc-200">{item}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {[
                        ['24/7', 'Concierge chat'],
                        ['$0', 'Diagnostic visit'],
                        ['2 yr', 'Coverage window'],
                      ].map(([value, label]) => (
                        <div key={label} className="rounded-lg border border-cyan-200/15 bg-cyan-200/[0.06] p-4">
                          <p className="text-2xl font-black text-white">{value}</p>
                          <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.2em] text-cyan-200/70">{label}</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-5 text-xs leading-6 text-zinc-500">
                      Coverage includes accidental incident triage, launch-day activation help, transfer support, battery health checks, and priority routing for replacement evaluations once backend account services are connected.
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isDeliveryOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[110] flex items-center justify-center bg-black/72 p-4 backdrop-blur-xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 22, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.98 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="relative w-full max-w-4xl overflow-hidden rounded-lg border border-white/10 bg-[#05070a] text-white shadow-2xl"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(125,211,252,0.18),transparent_30%),linear-gradient(135deg,rgba(255,255,255,0.055),transparent_46%)]" />
                <button
                  type="button"
                  onClick={() => setIsDeliveryOpen(false)}
                  className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-black"
                  aria-label="Close delivery tracking"
                >
                  <X size={16} />
                </button>
                <div className="relative z-10 grid gap-7 p-6 md:grid-cols-[0.9fr_1.1fr] md:p-8">
                  <div>
                    <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-cyan-200">Delivery Tracking</p>
                    <h2 className="mt-4 text-5xl font-black uppercase tracking-tight">Titan Route</h2>
                    <p className="mt-5 text-sm leading-7 text-zinc-400">
                      Your build status preview is ready for backend tracking. Once payment is connected, this panel can receive live courier events.
                    </p>
                    <div className="mt-8 rounded-lg border border-cyan-200/20 bg-cyan-200/10 p-5">
                      <div className="flex items-center gap-3">
                        <Truck className="text-cyan-200" size={22} />
                        <p className="text-lg font-black uppercase">Courier standby</p>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-zinc-300">Estimated ship window: 2-5 business days after reservation approval.</p>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => setDeliveryFocus('Courier handoff')}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-[11px] font-mono font-black uppercase tracking-widest text-white hover:border-cyan-300"
                      >
                        Simulate Tracking
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeliveryFocus('Payment pending')}
                        className="rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 text-left text-[11px] font-mono font-black uppercase tracking-widest text-white hover:border-cyan-300"
                      >
                        Notify Me
                      </button>
                    </div>
                    <div className="mt-4 rounded-lg border border-white/10 bg-black/30 p-4">
                      <p className="text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">Selected update</p>
                      <p className="mt-2 text-lg font-black text-cyan-100">{deliveryFocus}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {[
                      ['Build configured', 'Finish, storage, and scale are locked locally.', true],
                      ['Payment pending', 'Connect backend checkout to activate order ID.', false],
                      ['Studio assembly', 'Quality check and TitanCare setup happen here.', false],
                      ['Courier handoff', 'Tracking number appears after dispatch.', false],
                    ].map(([title, copy, done], index) => (
                      <button
                        key={String(title)}
                        type="button"
                        onClick={() => setDeliveryFocus(String(title))}
                        className={`relative w-full rounded-lg border p-5 text-left transition-all hover:-translate-y-0.5 ${deliveryFocus === String(title) ? 'border-cyan-300/60 bg-cyan-300/10' : 'border-white/10 bg-white/[0.04] hover:border-cyan-300/35'}`}
                      >
                        <div className="flex gap-4">
                          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border ${done ? 'border-cyan-200 bg-cyan-200 text-black' : 'border-white/15 text-zinc-500'}`}>
                            {done ? <Check size={16} /> : <Clock size={16} />}
                          </span>
                          <div>
                            <p className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500">Step {index + 1}</p>
                            <h3 className="mt-2 text-xl font-black uppercase">{title}</h3>
                            <p className="mt-2 text-sm leading-6 text-zinc-400">{copy}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isProfileSetupOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99] flex items-center justify-center bg-black/80 p-4 backdrop-blur-xl"
            >
              <motion.div
                initial={{ opacity: 0, y: 24, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="relative max-h-[92vh] w-full max-w-6xl overflow-y-auto rounded-lg border border-white/10 bg-[#030712] text-white shadow-2xl"
              >
                <Aurora colorStops={['#0f172a', '#67e8f9', '#1d4ed8']} blend={0.45} amplitude={0.9} speed={0.45} />
                <div className="absolute inset-0 bg-black/42" />
                <button
                  type="button"
                  onClick={() => setIsProfileSetupOpen(false)}
                  className="absolute right-5 top-5 z-20 grid h-10 w-10 place-items-center rounded-full bg-white text-black"
                  aria-label="Close profile setup"
                >
                  <X size={16} />
                </button>
                <div className="relative z-10 p-6 md:p-8">
                  <div className="flex flex-col gap-6 border-b border-white/10 pb-7 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                      <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-cyan-200">Titan ID</p>
                      <h2 className="mt-4 text-5xl font-black uppercase tracking-tight">
                        {savedProfile ? 'Manage Profile' : 'Profile Setup'}
                      </h2>
                      <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-300">
                        {savedProfile
                          ? 'Control saved builds, delivery readiness, TitanCare preferences, and checkout details from one studio dashboard.'
                          : 'Create a Titan profile to unlock saved builds, delivery tracking, TitanCare coverage, and faster checkout.'}
                      </p>
                    </div>
                    {savedProfile && (
                      <button
                        type="button"
                        onClick={logoutProfile}
                        className="inline-flex items-center justify-center gap-3 rounded-lg border border-white/15 px-5 py-4 text-[11px] font-mono font-black uppercase tracking-widest text-white hover:border-cyan-300"
                      >
                        <LogOut size={15} /> Logout
                      </button>
                    )}
                  </div>

                  <div className="mt-7 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-5">
                      <div className="rounded-lg border border-white/10 bg-black/45 p-5 backdrop-blur-md">
                        <div className="flex items-center gap-4">
                          <div className="grid h-16 w-16 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-300/10 text-2xl font-black text-cyan-100">
                            {((savedProfile?.name ?? profileForm.name) || 'T').slice(0, 1).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xl font-black text-white">{savedProfile?.name ?? 'Titan Guest'}</p>
                            <p className="mt-1 text-sm text-zinc-400">{savedProfile?.email ?? 'Create profile to sync studio features'}</p>
                          </div>
                        </div>
                        <div className="mt-5 grid grid-cols-3 gap-3">
                          {[
                            [savedBuilds.filter((build) => build.profileEmail === savedProfile?.email).length || 0, 'Builds'],
                            [profilePrefs.titanCare ? 'On' : 'Off', 'TitanCare'],
                            [profilePrefs.fastCheckout ? 'Ready' : 'Setup', 'Checkout'],
                          ].map(([value, label]) => (
                            <div key={label as string} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                              <p className="text-xl font-black text-white">{value}</p>
                              <p className="mt-1 text-[10px] font-mono uppercase tracking-[0.22em] text-zinc-500">{label as string}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-black/45 p-5 backdrop-blur-md">
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.26em] text-cyan-200">Quick Actions</p>
                        <div className="mt-4 grid gap-3">
                          {[
                            { label: 'Saved builds', Icon: Save, action: () => savedProfile ? setIsSavedBuildsOpen(true) : setIsProfileSetupOpen(true) },
                            { label: 'Delivery tracking', Icon: Truck, action: () => savedProfile ? setIsDeliveryOpen(true) : setIsProfileSetupOpen(true) },
                            { label: 'TitanCare coverage', Icon: Shield, action: () => savedProfile ? setIsCareOpen(true) : setIsProfileSetupOpen(true) },
                            { label: 'Checkout current build', Icon: CreditCard, action: openCheckout },
                          ].map(({ label, Icon, action }) => (
                            <button
                              key={label}
                              type="button"
                              onClick={action}
                              className="group flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-4 text-left text-sm font-bold text-zinc-200 transition-all hover:-translate-y-0.5 hover:border-cyan-300/60 hover:bg-cyan-300/[0.08]"
                            >
                              <span className="flex items-center gap-3"><Icon size={16} className="text-cyan-200" />{label}</span>
                              <ChevronRight size={16} className="text-cyan-200 transition-transform group-hover:translate-x-1" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5">
                      <div className="rounded-lg border border-white/10 bg-black/45 p-5 backdrop-blur-md">
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.26em] text-cyan-200">Account Details</p>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                          <label className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                            Full Name
                            <input
                              value={profileForm.name}
                              onChange={(event) => {
                                setProfileForm((form) => ({ ...form, name: event.target.value }));
                                setProfileErrors((errors) => ({ ...errors, name: undefined, submit: undefined }));
                              }}
                              aria-invalid={Boolean(profileErrors.name)}
                              className={`mt-2 h-12 w-full rounded-lg border bg-white/[0.06] px-4 text-sm text-white outline-none focus:border-cyan-300 ${profileErrors.name ? 'border-red-400/70' : 'border-white/10'}`}
                              placeholder="Alex Titan"
                              required
                            />
                            {profileErrors.name && <span className="mt-2 block text-xs normal-case tracking-normal text-red-300">{profileErrors.name}</span>}
                          </label>
                          <label className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                            Email
                            <input
                              value={profileForm.email}
                              onChange={(event) => {
                                setProfileForm((form) => ({ ...form, email: event.target.value }));
                                setProfileErrors((errors) => ({ ...errors, email: undefined, submit: undefined }));
                              }}
                              aria-invalid={Boolean(profileErrors.email)}
                              className={`mt-2 h-12 w-full rounded-lg border bg-white/[0.06] px-4 text-sm text-white outline-none focus:border-cyan-300 ${profileErrors.email ? 'border-red-400/70' : 'border-white/10'}`}
                              placeholder="you@example.com"
                              type="email"
                              required
                            />
                            {profileErrors.email && <span className="mt-2 block text-xs normal-case tracking-normal text-red-300">{profileErrors.email}</span>}
                          </label>
                          <label className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                            Phone
                            <input
                              value={profileForm.phone}
                              onChange={(event) => {
                                setProfileForm((form) => ({ ...form, phone: event.target.value }));
                                setProfileErrors((errors) => ({ ...errors, phone: undefined, submit: undefined }));
                              }}
                              aria-invalid={Boolean(profileErrors.phone)}
                              className={`mt-2 h-12 w-full rounded-lg border bg-white/[0.06] px-4 text-sm text-white outline-none focus:border-cyan-300 ${profileErrors.phone ? 'border-red-400/70' : 'border-white/10'}`}
                              placeholder="+1 555 0188"
                              type="tel"
                              required
                            />
                            {profileErrors.phone && <span className="mt-2 block text-xs normal-case tracking-normal text-red-300">{profileErrors.phone}</span>}
                          </label>
                          <label className="text-xs font-bold uppercase tracking-[0.16em] text-zinc-400">
                            Preferred Delivery
                            <select
                              value={profilePrefs.preferredDelivery}
                              onChange={(event) => setProfilePrefs((prefs) => ({ ...prefs, preferredDelivery: event.target.value }))}
                              className="mt-2 h-12 w-full rounded-lg border border-white/10 bg-white/[0.06] px-4 text-sm text-white outline-none focus:border-cyan-300"
                            >
                              {['Launch Courier', 'Priority Air', 'Studio Express'].map((method) => <option key={method}>{method}</option>)}
                            </select>
                          </label>
                        </div>
                        <button
                          type="button"
                          onClick={submitProfile}
                          className="mt-5 w-full rounded-lg bg-white px-6 py-4 text-[12px] font-mono font-black uppercase tracking-widest text-black transition-colors hover:bg-cyan-300"
                        >
                          Save Profile
                        </button>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-3">
                        {[
                          ['Launch alerts', 'Notify me when production changes.', 'launchAlerts'],
                          ['TitanCare sync', 'Keep coverage visible during checkout.', 'titanCare'],
                          ['Fast checkout', 'Use profile info for payment flow.', 'fastCheckout'],
                        ].map(([title, copy, key]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setProfilePrefs((prefs) => ({ ...prefs, [key as keyof typeof profilePrefs]: !prefs[key as keyof typeof profilePrefs] }))}
                            className={`rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 ${profilePrefs[key as keyof typeof profilePrefs] ? 'border-cyan-300/45 bg-cyan-300/[0.08]' : 'border-white/10 bg-white/[0.035]'}`}
                          >
                            <span className="flex items-center justify-between gap-3">
                              <span className="text-sm font-black text-white">{title}</span>
                              <span className={`h-3 w-3 rounded-full ${profilePrefs[key as keyof typeof profilePrefs] ? 'bg-cyan-300 shadow-[0_0_18px_rgba(103,232,249,0.6)]' : 'bg-zinc-700'}`} />
                            </span>
                            <span className="mt-3 block text-xs leading-5 text-zinc-400">{copy}</span>
                          </button>
                        ))}
                      </div>

                      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-5">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-[10px] font-mono font-black uppercase tracking-[0.26em] text-zinc-500">Recommended next step</p>
                            <p className="mt-2 text-lg font-black text-white">{savedProfile ? 'Save your current Titan build' : 'Create your Titan profile'}</p>
                            {(profileErrors.submit || profileNotice) && (
                              <p className={`mt-2 text-xs font-bold ${profileErrors.submit ? 'text-red-300' : 'text-cyan-200'}`}>
                                {profileErrors.submit || profileNotice}
                              </p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={savedProfile ? saveCurrentBuild : submitProfile}
                            className="rounded-lg bg-white px-6 py-4 text-[12px] font-mono font-black uppercase tracking-widest text-black transition-colors hover:bg-cyan-300"
                          >
                            {savedProfile ? 'Save Build' : 'Save Profile'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isPaymentOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[101] overflow-y-auto bg-[#f4f5f7] text-black"
            >
              <motion.div
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-6 md:px-8"
              >
                <div className="mb-6 flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm">
                  <div>
                    <div className="text-2xl font-black tracking-tight">TITAN</div>
                    <p className="mt-1 text-[10px] font-mono font-black uppercase tracking-[0.24em] text-zinc-400">Secure checkout</p>
                  </div>
                  <div className="hidden items-center gap-2 rounded-full bg-zinc-100 p-1 text-xs font-black uppercase tracking-wide md:flex">
                    {['Bag', 'Shipping', 'Payment'].map((step, index) => (
                      <span
                        key={step}
                        className={`rounded-full px-4 py-2 ${index === 2 && paymentStep === 'review' ? 'bg-black text-white' : index < 2 ? 'bg-white text-blue-900 shadow-sm' : 'text-zinc-400'}`}
                      >
                        {step}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPaymentOpen(false)}
                    className="grid h-11 w-11 place-items-center rounded-full bg-black text-white"
                    aria-label="Close payment"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="mb-7 flex justify-center gap-4 text-sm font-bold text-blue-900 md:gap-8">
                  {[
                    ['Contact', User],
                    ['Shipping', Package],
                    ['Review & Payment', CreditCard],
                  ].map(([step, Icon], index) => (
                    <button
                      key={step as string}
                      type="button"
                      onClick={() => index === 2 && setPaymentStep('review')}
                      className={`flex items-center gap-3 ${index === 2 && paymentStep !== 'review' ? 'text-zinc-400' : ''}`}
                    >
                      <span className={`grid h-10 w-10 place-items-center rounded-full border ${index < 2 || paymentStep === 'review' ? 'border-blue-900 bg-white' : 'border-zinc-300 text-zinc-400'}`}>
                        <Icon size={17} />
                      </span>
                      <span>{step as string}</span>
                    </button>
                  ))}
                </div>

                <div className="grid flex-1 gap-7 lg:grid-cols-[1.25fr_0.85fr]">
                  <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
                    {paymentStep === 'shipping' ? (
                      <>
                        <h2 className="text-3xl font-black tracking-tight text-blue-950">Shipping Address</h2>
                        <div className="mt-5 h-px bg-zinc-200" />
                        <div className="mt-7 grid gap-5 md:grid-cols-2">
                          {[
                            ['firstName', 'First name'],
                            ['lastName', 'Last name'],
                            ['phone', 'Phone number'],
                            ['email', 'Email address'],
                          ].map(([key, label]) => (
                            <label key={key} className="text-sm font-semibold text-zinc-700">
                              {label} <span className="text-red-500">*</span>
                              <input
                                value={shippingForm[key as keyof typeof shippingForm]}
                                onChange={(event) => setShippingForm((form) => ({ ...form, [key]: event.target.value }))}
                                className="mt-2 h-12 w-full border border-zinc-300 bg-blue-50/50 px-4 text-sm outline-none focus:border-blue-900"
                                placeholder={label}
                              />
                            </label>
                          ))}
                          <label className="text-sm font-semibold text-zinc-700">
                            Country <span className="text-red-500">*</span>
                            <select
                              value={shippingForm.country}
                              onChange={(event) => setShippingForm((form) => ({ ...form, country: event.target.value }))}
                              className="mt-2 h-12 w-full border border-zinc-300 bg-blue-50/50 px-4 text-sm outline-none focus:border-blue-900"
                            >
                              {countries.map((country) => <option key={country}>{country}</option>)}
                            </select>
                          </label>
                          <label className="text-sm font-semibold text-zinc-700">
                            State / Region <span className="text-red-500">*</span>
                            <select
                              value={shippingForm.state}
                              onChange={(event) => setShippingForm((form) => ({ ...form, state: event.target.value }))}
                              className="mt-2 h-12 w-full border border-zinc-300 bg-blue-50/50 px-4 text-sm outline-none focus:border-blue-900"
                            >
                              {(shippingForm.country === 'United States' ? usStates : ['Province / Region', 'Capital Region', 'Metro Region', 'North Region', 'South Region']).map((state) => <option key={state}>{state}</option>)}
                            </select>
                          </label>
                          <label className="text-sm font-semibold text-zinc-700">
                            City <span className="text-red-500">*</span>
                            <input
                              value={shippingForm.city}
                              onChange={(event) => setShippingForm((form) => ({ ...form, city: event.target.value }))}
                              className="mt-2 h-12 w-full border border-zinc-300 bg-blue-50/50 px-4 text-sm outline-none focus:border-blue-900"
                              placeholder="City"
                            />
                          </label>
                          <label className="text-sm font-semibold text-zinc-700">
                            Zip/Postal Code <span className="text-red-500">*</span>
                            <input
                              value={shippingForm.zip}
                              onChange={(event) => setShippingForm((form) => ({ ...form, zip: event.target.value }))}
                              className="mt-2 h-12 w-full border border-zinc-300 bg-blue-50/50 px-4 text-sm outline-none focus:border-blue-900"
                              placeholder="Zip or postal code"
                            />
                          </label>
                          <label className="md:col-span-2 text-sm font-semibold text-zinc-700">
                            Street Address <span className="text-red-500">*</span>
                            <input
                              value={shippingForm.street}
                              onChange={(event) => setShippingForm((form) => ({ ...form, street: event.target.value }))}
                              className="mt-2 h-12 w-full border border-zinc-300 bg-blue-50/50 px-4 text-sm outline-none focus:border-blue-900"
                              placeholder="Street, apartment, suite"
                            />
                          </label>
                        </div>
                        <h3 className="mt-10 text-3xl font-black tracking-tight text-blue-950">Shipping Methods</h3>
                        <div className="mt-5 grid gap-3 border-t border-zinc-200 pt-6">
                          {shippingMethods.map((method) => (
                            <label
                              key={method.id}
                              className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 text-sm transition-colors ${selectedShipping === method.id ? 'border-blue-900 bg-blue-50' : 'border-zinc-200 hover:border-blue-300'}`}
                            >
                              <input
                                type="radio"
                                checked={selectedShipping === method.id}
                                onChange={() => setSelectedShipping(method.id)}
                                className="accent-blue-900"
                              />
                              <span className="font-black">{method.price === 0 ? 'US$ 0.00' : `US$ ${method.price.toFixed(2)}`}</span>
                              <span className="flex-1">
                                <span className="block font-black">{method.label}</span>
                                <span className="mt-1 block text-zinc-500">{method.copy}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setPaymentStep('review')}
                          className="mt-8 rounded-full bg-black px-8 py-4 text-sm font-black uppercase tracking-wide text-white"
                        >
                          Continue to Review
                        </button>
                      </>
                    ) : (
                      <>
                        <h2 className="text-3xl font-black tracking-tight text-blue-950">Review & Payment</h2>
                        <div className="mt-5 h-px bg-zinc-200" />
                        <div className="mt-7 grid gap-4">
                          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                            <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Ship to</p>
                            <p className="mt-3 font-black">{shippingForm.firstName || 'First'} {shippingForm.lastName || 'Last'}</p>
                            <p className="mt-1 text-sm text-zinc-600">{shippingForm.street || 'Street address'}, {shippingForm.city || 'City'}, {shippingForm.state}</p>
                          </div>
                          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-black uppercase tracking-widest text-zinc-500">Payment Method</p>
                              <div className="flex gap-2">
                                <span className="rounded-md bg-[#1434cb] px-3 py-1 text-xs font-black text-white">VISA</span>
                                <span className="rounded-md bg-black px-3 py-1 text-xs font-black text-white">mastercard</span>
                                <span className="rounded-md bg-zinc-200 px-3 py-1 text-xs font-black text-zinc-700">BANK</span>
                              </div>
                            </div>
                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                              <input className="h-12 border border-zinc-300 px-4 text-sm outline-none focus:border-blue-900" placeholder="Card number" />
                              <input className="h-12 border border-zinc-300 px-4 text-sm outline-none focus:border-blue-900" placeholder="Name on card" />
                              <input className="h-12 border border-zinc-300 px-4 text-sm outline-none focus:border-blue-900" placeholder="MM / YY" />
                              <input className="h-12 border border-zinc-300 px-4 text-sm outline-none focus:border-blue-900" placeholder="CVC" />
                            </div>
                          </div>
                        </div>
                        <button className="mt-8 rounded-full bg-black px-8 py-4 text-sm font-black uppercase tracking-wide text-white">
                          Pay {paymentTotal}
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentStep('shipping')}
                          className="ml-3 rounded-full border border-black px-8 py-4 text-sm font-black uppercase tracking-wide"
                        >
                          Back
                        </button>
                      </>
                    )}
                  </div>
                  <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
                    <h2 className="text-3xl font-black tracking-tight">Order Summary</h2>
                    <div className="mt-7 border-t border-zinc-200 pt-5">
                      <p className="font-black text-blue-950">{cartQuantity} Item in Cart</p>
                      <div className="mt-5 flex gap-4">
                        <div
                          className="relative h-24 w-16 shrink-0 rounded-2xl border border-zinc-200 shadow-inner"
                          style={{ background: `linear-gradient(135deg, #ffffff, ${checkoutFinishColor}, #64748b)` }}
                        >
                          <span className="absolute left-3 top-3 h-4 w-4 rounded-full bg-black" />
                          <span className="absolute right-3 top-4 h-4 w-4 rounded-full bg-black" />
                          <span className="absolute left-3 top-10 h-4 w-4 rounded-full bg-black" />
                        </div>
                        <div>
                          <p className="font-black text-blue-700">Titan 17 Pro {activeStorage}</p>
                          <p className="mt-2 text-sm">Qty: {cartQuantity}</p>
                          <p className="mt-2 text-xl font-black">{cartTotal}</p>
                        </div>
                      </div>
                      <div className="mt-5 space-y-3 border-t border-zinc-200 pt-5 text-sm">
                        <div className="flex justify-between"><span>Shipping</span><span className="font-black">{activeShipping.price === 0 ? 'Free' : `$${activeShipping.price.toFixed(2)}`}</span></div>
                        <div className="flex justify-between text-lg font-black"><span>Total</span><span>{paymentTotal}</span></div>
                      </div>
                    </div>
                    <button className="mt-8 w-full rounded-full border border-black px-6 py-4 text-sm font-black uppercase tracking-wide">
                      Apply Discount Code
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentStep('review')}
                      className="mt-4 w-full rounded-full bg-black px-6 py-4 text-sm font-black uppercase tracking-wide text-white"
                    >
                      {paymentStep === 'review' ? 'Pay Securely' : 'Review & Pay'}
                    </button>
                  </aside>
                </div>
                <footer className="mt-8 rounded-2xl bg-white px-5 py-4 text-xs font-bold text-zinc-500 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <span>Encrypted checkout preview for Titan 17 Pro. Demo only, no real payments are processed.</span>
                    <span className="flex items-center gap-2"><Shield size={14} /> Secure session · PCI-ready layout</span>
                    <a
                      href="https://github.com/zacharyahutton"
                      target="_blank"
                      rel="noreferrer"
                      className="font-black uppercase tracking-[0.18em] text-black hover:text-blue-900"
                    >
                      Built by Zachary Hutton
                    </a>
                  </div>
                </footer>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isCheckoutOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/88 p-4 md:p-6"
            >
              <motion.div
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.99 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg border border-white/10 bg-[#050505] text-white shadow-2xl"
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_28%_24%,rgba(125,211,252,0.10),transparent_34%),linear-gradient(135deg,rgba(255,255,255,0.04),transparent_42%)]" />

                <button
                  onClick={() => setIsCheckoutOpen(false)}
                  className="absolute right-5 top-5 z-50 grid h-11 w-11 place-items-center rounded-full bg-white text-black transition-transform hover:scale-105"
                >
                  <X size={18} strokeWidth={2.4} />
                </button>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-[0.9fr_1fr]">
                  <div className="relative flex min-h-[340px] items-center justify-center border-b border-white/10 p-6 lg:border-b-0 lg:border-r">
                    <div className="absolute left-6 top-6">
                      <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-cyan-200">
                        Secure Checkout
                      </p>
                      <h2 className="mt-4 text-5xl font-black uppercase tracking-tight md:text-7xl">
                        Your Titan
                      </h2>
                    </div>
                    <div className="relative mt-20 flex w-full max-w-md items-end justify-center gap-5">
                      <div
                        className="relative h-60 w-32 rounded-[1.75rem] border border-white/15 p-2 shadow-[0_28px_90px_rgba(125,211,252,0.16)]"
                        style={{
                          background: `linear-gradient(135deg, ${checkoutFinishHighlight}, ${checkoutFinishColor} 44%, #1f2937)`,
                        }}
                      >
                        <div className="absolute left-5 top-5 grid grid-cols-2 gap-2">
                          <span className="h-8 w-8 rounded-full border border-black/20 bg-black" />
                          <span className="h-8 w-8 rounded-full border border-black/20 bg-black" />
                          <span className="h-8 w-8 rounded-full border border-black/20 bg-black" />
                        </div>
                        <div className="absolute right-7 top-20 h-5 w-5 rounded-full bg-zinc-500" />
                        <div className="absolute left-1/2 top-40 h-14 w-11 -translate-x-1/2 rounded-full bg-black/45" />
                      </div>
                      <div
                        className="relative h-60 w-32 rounded-[1.75rem] border border-white/15 p-2 shadow-[0_28px_90px_rgba(16,185,129,0.12)]"
                        style={{
                          background: `linear-gradient(180deg, #020617, ${checkoutScreenGlow} 118%)`,
                        }}
                      >
                        <div
                          className="h-full w-full overflow-hidden rounded-[1.6rem] border border-white/10"
                          style={{
                            background: `radial-gradient(circle at 50% 24%, ${checkoutScreenGlow}, transparent 30%), linear-gradient(180deg, #020617, ${checkoutScreenGlow})`,
                          }}
                        />
                        <div className="absolute left-1/2 top-6 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between p-6">
                    <div>
                      <p className="text-[10px] font-mono font-black uppercase tracking-[0.32em] text-cyan-200">
                        Build Summary
                      </p>
                      <div className="mt-8 space-y-3">
                        {[
                          ['Model', 'Titan 17 Pro'],
                          ['Finish', activeColorName],
                          ['Storage', activeStorage],
                          ['Studio scale', `${Math.round(modelScale * 100)}%`],
                        ].map(([label, value]) => (
                          <div key={label} className="flex items-center justify-between border-b border-white/10 py-4">
                            <span className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-400">{label}</span>
                            <span className="text-sm font-black uppercase text-white">{value}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-8 rounded-lg border border-white/10 bg-white/[0.04] p-5">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-mono font-black uppercase tracking-[0.24em] text-zinc-400">
                            Quantity
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => setCartQuantity((value) => Math.max(1, value - 1))}
                              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-cyan-300"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="w-8 text-center text-lg font-black">{cartQuantity}</span>
                            <button
                              onClick={() => setCartQuantity((value) => Math.min(9, value + 1))}
                              className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-white transition-colors hover:border-cyan-300"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8">
                      <div className="flex items-end justify-between border-t border-white/10 pt-6">
                        <p className="text-[10px] font-mono font-black uppercase tracking-[0.28em] text-zinc-400">Total</p>
                        <p className="text-4xl font-black">{cartTotal}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCheckoutOpen(false);
                          setIsPaymentOpen(true);
                        }}
                        className="mt-6 w-full rounded-lg bg-cyan-300 px-6 py-4 text-[12px] font-mono font-black uppercase tracking-widest text-black transition-colors hover:bg-white"
                      >
                        Continue to Payment
                      </button>
                      <button
                        type="button"
                        onClick={saveCurrentBuild}
                        className="mt-3 w-full rounded-lg border border-white/15 px-6 py-4 text-[12px] font-mono font-black uppercase tracking-widest text-white transition-colors hover:border-cyan-300 hover:text-cyan-200"
                      >
                        Save This Build
                      </button>
                      <button
                        onClick={() => {
                          setIsCheckoutOpen(false);
                          lenis?.scrollTo('#section-customizer', {
                            duration: 1.1,
                            easing: (t: number) => 1 - Math.pow(1 - t, 4),
                          });
                        }}
                        className="mt-3 w-full rounded-lg border border-white/15 px-6 py-4 text-[12px] font-mono font-black uppercase tracking-widest text-white transition-colors hover:border-amber-500 hover:text-amber-500"
                      >
                        Back to Lab
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
