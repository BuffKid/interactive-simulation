'use client'
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sonner } from '@/components/ui/sonner';
import { Play, Pause, RotateCcw, Plus, Trash2, Brain, TrendingUp, Users, Zap, Settings, Key, AlertCircle, Activity, Target, Shield, Flame, TriangleAlert } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { ScrollArea } from "@/components/ui/scroll-area"
import { HelpCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"


const PandemicMindsSimulator = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentDay, setCurrentDay] = useState(0);
  const [networkSize, setNetworkSize] = useState(100);
  const [apiKey, setApiKey] = useState('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(300);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // Time series data for charts
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [currentStats, setCurrentStats] = useState({
    susceptible: 100,
    infected: 0,
    resistant: 0,
    trust: 75,
    chaos: 0,
    polarization: 0,
    socialCohesion: 80,
    criticalThinking: 60
  });

  // Preset beliefs with realistic parameters
  const [presetBeliefs] = useState([
    {
      id: 1,
      name: "Social Media Misinformation",
      description: "False news spreads faster than truth on social platforms",
      virality: 0.85,
      stickiness: 0.4,
      resistance: 0.3,
      polarization: 0.7,
      emotionalImpact: 0.6,
      color: "#ef4444",
      icon: "📱"
    },
    {
      id: 2,
      name: "Health Conspiracy Theory",
      description: "Alternative medicine claims without scientific backing",
      virality: 0.6,
      stickiness: 0.8,
      resistance: 0.6,
      polarization: 0.9,
      emotionalImpact: 0.8,
      color: "#f59e0b",
      icon: "💊"
    },
    {
      id: 3,
      name: "Positive Movement",
      description: "Grassroots movement for social good",
      virality: 0.5,
      stickiness: 0.9,
      resistance: 0.2,
      polarization: 0.1,
      emotionalImpact: 0.7,
      color: "#10b981",
      icon: "🌱"
    },
    {
      id: 4,
      name: "Economic Panic",
      description: "Fear-driven financial behavior (bank runs, hoarding)",
      virality: 0.9,
      stickiness: 0.3,
      resistance: 0.4,
      polarization: 0.5,
      emotionalImpact: 0.9,
      color: "#dc2626",
      icon: "📉"
    },
    {
      id: 5,
      name: "Scientific Breakthrough",
      description: "Revolutionary discovery that changes worldview",
      virality: 0.4,
      stickiness: 0.95,
      resistance: 0.7,
      polarization: 0.3,
      emotionalImpact: 0.5,
      color: "#3b82f6",
      icon: "🔬"
    },
    {
      id: 6,
      name: "Celebrity Endorsement",
      description: "Popular figure promotes idea or product",
      virality: 0.8,
      stickiness: 0.4,
      resistance: 0.3,
      polarization: 0.4,
      emotionalImpact: 0.6,
      color: "#8b5cf6",
      icon: "⭐"
    }
  ]);

  const [customBeliefs, setCustomBeliefs] = useState([]);
  const [selectedBelief, setSelectedBelief] = useState(presetBeliefs[0]);
  const [newBeliefText, setNewBeliefText] = useState('');
  const [newBeliefName, setNewBeliefName] = useState('');

  // Network simulation data
  const networkRef = useRef({
    nodes: [],
    connections: [],
    activeBeliefs: new Map()
  });

  // Initialize network
  const initializeNetwork = useCallback(() => {
    const nodes = [];
    for (let i = 0; i < networkSize; i++) {
      nodes.push({
        id: i,
        skepticism: Math.random(),
        criticalThinking: Math.random(),
        socialInfluence: Math.random(),
        emotionalSusceptibility: Math.random(),
        trustInMedia: Math.random(),
        beliefs: new Set(),
        state: 'susceptible',
        infectionDay: -1,
        connections: []
      });
    }

    // Create small-world network
    const connections = [];
    nodes.forEach((node, i) => {
      const connectionCount = Math.floor(Math.random() * 8) + 3;
      for (let j = 0; j < connectionCount; j++) {
        const targetId = Math.floor(Math.random() * networkSize);
        if (targetId !== i && !node.connections.includes(targetId)) {
          node.connections.push(targetId);
          connections.push({
            source: i,
            target: targetId,
            trust: Math.random(),
            strength: Math.random()
          });
        }
      }
    });

    networkRef.current = { nodes, connections, activeBeliefs: new Map() };
    
    // Reset stats
    setCurrentStats({
      susceptible: networkSize,
      infected: 0,
      resistant: 0,
      trust: 75,
      chaos: 0,
      polarization: 0,
      socialCohesion: 80,
      criticalThinking: 60
    });
    setTimeSeriesData([]);
    setCurrentDay(0);
  }, [networkSize]);

  // AI-powered belief parameter generation
  const generateBeliefWithAI = async (beliefName, beliefDescription) => {
    if (!apiKey) {
      toast.error('Please enter your OpenAI API key first!', {
        description: 'An API key is required to generate custom beliefs.',
        icon: <Key className="h-4 w-4" />
      });
      return null;
    }

    setIsLoadingAI(true);
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [{
            role: 'system',
            content: `You are an expert in social psychology and information spread. Analyze the given belief/idea and return ONLY a JSON object with these parameters (all values between 0 and 1):
            - virality: how quickly it spreads (0=slow, 1=extremely fast)
            - stickiness: how long people hold the belief (0=quickly forgotten, 1=permanent)
            - resistance: how hard it is to debunk (0=easily disproven, 1=very resistant)
            - polarization: how much it divides people (0=unifying, 1=extremely divisive)
            - emotionalImpact: emotional intensity (0=rational, 1=highly emotional)
            
            Consider factors like: controversy, evidence base, emotional appeal, complexity, existing beliefs, social proof, authority figures, etc.`
          }, {
            role: 'user',
            content: `Belief name: "${beliefName}"\nDescription: "${beliefDescription}"`
          }],
          temperature: 0.3,
          max_tokens: 200
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error.message);
      }

      const content = data.choices[0].message.content.trim();
      const params = JSON.parse(content);
      
      // Add some randomness for unpredictability
      Object.keys(params).forEach(key => {
        const randomFactor = (Math.random() - 0.5) * 0.2; // ±10% randomness
        params[key] = Math.max(0, Math.min(1, params[key] + randomFactor));
      });

      return params;
    } catch (error) {
      toast.error('AI Generation Failed', {
        description: error.message,
        icon: <AlertCircle className="h-4 w-4" />
      });
      return null;
    } finally {
      setIsLoadingAI(false);
    }
  };

  // Add custom belief
  const addCustomBelief = async () => {
    if (!newBeliefName.trim() || !newBeliefText.trim()) {
      toast.warning('Missing Information', {
        description: 'Please fill in both name and description!',
        icon: <AlertCircle className="h-4 w-4" />
      });
      return;
    }

    const aiParams = await generateBeliefWithAI(newBeliefName, newBeliefText);
    if (!aiParams) return;

    const newBelief = {
      id: Date.now(),
      name: newBeliefName,
      description: newBeliefText,
      ...aiParams,
      color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
      icon: "🤖",
      isCustom: true
    };

    setCustomBeliefs([...customBeliefs, newBelief]);
    setNewBeliefName('');
    setNewBeliefText('');
    
    toast.success('Belief Created', {
      description: `Successfully created new belief: ${newBeliefName}`,
      icon: <Brain className="h-4 w-4" />
    });
  };

  // Remove custom belief
  const removeCustomBelief = (id) => {
    setCustomBeliefs(customBeliefs.filter(b => b.id !== id));
    if (selectedBelief.id === id) {
      setSelectedBelief(presetBeliefs[0]);
    }
  };

  // Simulation step with enhanced realism
  const simulationStep = useCallback(() => {
    const { nodes, connections } = networkRef.current;
    let newInfections = 0;
    let totalChaos = 0;
    let totalPolarization = 0;
    let trustDecay = 0;
    let cohesionChange = 0;

    // Spread mechanism with randomness
    connections.forEach(connection => {
      const source = nodes[connection.source];
      const target = nodes[connection.target];

      if (source.state === 'infected' && target.state === 'susceptible') {
        // Base transmission probability
        let transmissionChance = 
          selectedBelief.virality * 
          connection.trust * 
          (1 - target.skepticism * target.criticalThinking) * 
          (target.emotionalSusceptibility * selectedBelief.emotionalImpact);

        // Add randomness for unpredictability
        transmissionChance *= (0.7 + Math.random() * 0.6); // 70-130% of calculated chance
        
        // Social influence boost
        if (source.socialInfluence > 0.7) {
          transmissionChance *= 1.3;
        }

        // Media trust factor
        if (target.trustInMedia > 0.8 && selectedBelief.name.includes('Media')) {
          transmissionChance *= 1.4;
        }

        if (transmissionChance > Math.random()) {
          target.state = 'infected';
          target.infectionDay = currentDay;
          target.beliefs.add(selectedBelief.id);
          newInfections++;
          
          // Chaos increases with emotional beliefs
          totalChaos += selectedBelief.emotionalImpact * 5;
          totalPolarization += selectedBelief.polarization * 3;
          trustDecay += selectedBelief.polarization * 0.5;
          cohesionChange -= selectedBelief.polarization * 2;
        }
      }
    });

    // Recovery/resistance mechanism
    nodes.forEach(node => {
      if (node.state === 'infected') {
        const daysSinceInfection = currentDay - node.infectionDay;
        const recoveryChance = 
          (1 - selectedBelief.stickiness) * 
          node.criticalThinking * 
          (daysSinceInfection / 10) * 
          Math.random();

        if (recoveryChance > 0.3) {
          node.state = 'resistant';
          cohesionChange += 1; // Recovery improves cohesion slightly
        }
      }
    });

    // Update statistics
    const infected = nodes.filter(n => n.state === 'infected').length;
    const resistant = nodes.filter(n => n.state === 'resistant').length;
    const susceptible = nodes.filter(n => n.state === 'susceptible').length;
    
    // Calculate average critical thinking
    const avgCriticalThinking = nodes.reduce((sum, node) => sum + node.criticalThinking, 0) / nodes.length * 100;

    const newStats = {
      susceptible,
      infected,
      resistant,
      trust: Math.max(0, Math.min(100, currentStats.trust - trustDecay)),
      chaos: Math.max(0, Math.min(100, currentStats.chaos + totalChaos)),
      polarization: Math.max(0, Math.min(100, currentStats.polarization + totalPolarization)),
      socialCohesion: Math.max(0, Math.min(100, currentStats.socialCohesion + cohesionChange)),
      criticalThinking: Math.max(0, Math.min(100, avgCriticalThinking))
    };

    setCurrentStats(newStats);
    
    // Add to time series
    setTimeSeriesData(prev => [...prev, {
      day: `Day: ${currentDay}` ,
      ...newStats
    }]);

  }, [selectedBelief, currentDay, currentStats]);

  // Start or amplify outbreak
  const startOutbreak = useCallback(() => {
    const { nodes } = networkRef.current;
    let currentInfected = nodes.filter(n => n.state === 'infected').length;
    
    // Calculate new infections based on current state
    let newInfectionsTarget;
    if (currentInfected === 0) {
      // Initial outbreak: 2% of population
      newInfectionsTarget = Math.max(1, Math.floor(networkSize * 0.02));
    } else {
      // Subsequent outbreaks: 30-70% increase of current infected
      const increaseFactor = 0.3 + Math.random() * 0.4; // 30-70% increase
      newInfectionsTarget = Math.floor(currentInfected * increaseFactor);
    }

    let newInfections = 0;
    let attempts = 0;
    const maxAttempts = networkSize * 2; // Prevent infinite loops
    
    while (newInfections < newInfectionsTarget && attempts < maxAttempts) {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)];
      if (randomNode.state === 'susceptible') {
        randomNode.state = 'infected';
        randomNode.infectionDay = currentDay;
        randomNode.beliefs.add(selectedBelief.id);
        newInfections++;
      }
      attempts++;
    }

    // Update current stats to reflect new infections
    const totalInfected = currentInfected + newInfections;
    setCurrentStats(prev => ({
      ...prev,
      infected: totalInfected,
      susceptible: networkSize - totalInfected
    }));

    // If simulation isn't running, start it
    if (!isPlaying) {
      setIsPlaying(true);
    }
  }, [networkSize, currentDay, selectedBelief, isPlaying, setIsPlaying]);

  // Reset simulation
  const resetSimulation = () => {
    setIsPlaying(false);
    initializeNetwork();
  };

  // Play/pause effect
  useEffect(() => {
    let interval;
    if (isPlaying) {
      // Start the simulation if it hasn't started yet
      if (currentStats.infected === 0) {
        startOutbreak();
      }
      interval = setInterval(() => {
        simulationStep();
        setCurrentDay(prev => prev + 1);
      }, simulationSpeed);
    }
    return () => clearInterval(interval);
  }, [isPlaying, simulationStep, currentStats.infected, simulationSpeed, startOutbreak]);

  // Initialize on mount
  useEffect(() => {
    initializeNetwork();
  }, [initializeNetwork]);

  // Chart data preparations
  const beliefComparisonData = [...presetBeliefs, ...customBeliefs].map(belief => ({
    name: belief.name.length > 15 ? belief.name.substring(0, 15) + '...' : belief.name,
    virality: belief.virality * 100,
    stickiness: belief.stickiness * 100,
    resistance: belief.resistance * 100,
    polarization: belief.polarization * 100
  }));

  const pieData = [
    { name: 'Susceptible', value: currentStats.susceptible, color: '#3b82f6' },
    { name: 'Infected', value: currentStats.infected, color: selectedBelief.color },
    { name: 'Resistant', value: currentStats.resistant, color: '#6b7280' }
  ];

  const radarData = [
    {
      subject: 'Virality',
      A: selectedBelief.virality * 100,
      fullMark: 100
    },
    {
      subject: 'Stickiness',
      A: selectedBelief.stickiness * 100,
      fullMark: 100
    },
    {
      subject: 'Resistance',
      A: selectedBelief.resistance * 100,
      fullMark: 100
    },
    {
      subject: 'Polarization',
      A: selectedBelief.polarization * 100,
      fullMark: 100
    },
    {
      subject: 'Emotional Impact',
      A: selectedBelief.emotionalImpact * 100,
      fullMark: 100
    }
  ];

  // Create tutorial dialog component
  const tutorialSteps = [
    {
      title: "Welcome to the Belief Simulation! 👋",
      description: "This simulator helps you understand how beliefs spread throughout the population. Let's learn how to use it!",
      targetId: "header",
      position: "bottom"
    },
    {
      title: "Create or Choose a Belief 🧠",
      description: "Start by entering a belief or select from existing ones. Each belief affects the population differently.",
      targetId: "belief-selection",
      position: "left"
    },
    {
      title: "Population Size 🌐",
      description: "Use the slider to adjust the population size. This determines how beliefs will spread.",
      targetId: "network-size",
      position: "left"
    },
    {
      title: "Simulation Speed ⚡",
      description: "Control how fast the simulation runs. Slower speeds help you observe details, faster speeds show long-term patterns. The lower the number the faster the simulation will run.",
      targetId: "simulation-speed",
      position: "left"
    },
    {
      title: "Control Panel ⚙️",
      description: "Use these buttons to play, pause, trigger outbreaks, or reset the simulation.",
      targetId: "control-buttons",
      position: "left"
    },
    {
      title: "Monitor Results 📊",
      description: "Watch these charts to see how beliefs spread and affect your population.",
      targetId: "charts-section",
      position: "right"
    }
  ];

  // Create a styled highlight component
  const Highlight = ({ children }) => (
    <div className="relative">
      {children}
      <div className="absolute inset-0 ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-900 rounded-lg pointer-events-none animate-pulse" />
    </div>
  );

  // Updated tutorial dialog component
  const TutorialDialog = () => {
    const currentStep = tutorialSteps[tutorialStep];
    const dialogRef = useRef(null); // Reference to the dialog content for size calculations
    const [dialogPosition, setDialogPosition] = useState({
      top: 'auto',
      bottom: 'auto',
      left: 'auto',
      right: 'auto',
    });

    useEffect(() => {
      if (!showTutorial || !currentStep.targetId) return;

      const element = document.getElementById(currentStep.targetId);
      if (!element) return;

      // Get the dialog's dimensions (fallback to defaults if not rendered yet)
      const dialogWidth = dialogRef.current?.getBoundingClientRect().width || 400;
      const dialogHeight = dialogRef.current?.getBoundingClientRect().height || 300;

      const rect = element.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 16; // Reduced margin for better fit

      let newPosition = { top: 'auto', bottom: 'auto', left: 'auto', right: 'auto' };

      // Calculate available space around the element
      const spaceLeft = rect.left;
      const spaceRight = viewportWidth - rect.right;
      const spaceTop = rect.top;
      const spaceBottom = viewportHeight - rect.bottom;

      // Determine position based on currentStep.position
      switch (currentStep.position) {
        case 'left':
          newPosition.left = `${Math.round(parseFloat((spaceLeft-dialogWidth/2)-margin))}px`;
          newPosition.top = `${Math.round(parseFloat((rect.top + dialogHeight/2)-margin))}px`;
          setDialogPosition(newPosition);
          break;

        case 'right':
          newPosition.left = `${Math.round(parseFloat(rect.right + margin))}px`;
          newPosition.top = `${Math.round(parseFloat(rect.top + rect.height / 2 - dialogHeight / 2))}px`;
          break;

        case 'top':
          newPosition.bottom = `${Math.round(parseFloat(viewportHeight - rect.top + margin))}px`;
          newPosition.left = `${Math.round(parseFloat(rect.left + rect.width / 2 - dialogWidth / 2))}px`;
          break;

        case 'bottom':
          newPosition.top = `${Math.round(parseFloat(rect.bottom*1.75 + margin))}px`;
          newPosition.left = `${Math.round(parseFloat(innerWidth / 2))}px`;
          break;

        default:
          // Default to bottom if position is invalid
          newPosition.top = `${Math.round(parseFloat(rect.bottom + margin))}px`;
          newPosition.left = `${Math.round(parseFloat(rect.left + rect.width / 2 - dialogWidth / 2))}px`;
          break;
      }

      setDialogPosition(newPosition);

      // Add highlight effect to target element
      element.classList.add('tutorial-highlight');
      element.style.position = 'relative';
      element.style.zIndex = '1000';

      // Scroll element into view with padding
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      });

      // Cleanup on unmount or step change
      return () => {
        document.querySelectorAll('.tutorial-highlight').forEach((el) => {
          el.classList.remove('tutorial-highlight');
          el.style.position = '';
          el.style.zIndex = '';
        });
      };
    }, [tutorialStep, showTutorial]);

    // CSS for the highlight effect
    const highlightStyles = `
      .tutorial-highlight {
        position: relative;
        z-index: 1000 !important;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.5), 0 0 20px rgba(59, 130, 246, 0.3);
        border-radius: 8px;
        transition: all 0.3s ease;
      }
    `;

    if (!showTutorial) return null;

    return (
      <>
        <style>{highlightStyles}</style>
        <Dialog open={showTutorial} onOpenChange={setShowTutorial} key="tutorial-dialog">
          <DialogContent
            ref={dialogRef}
            className="bg-slate-900/90 backdrop-blur-md border-white/10 text-white sm:max-w-[400px] tutorial-dialog shadow-xl"
            style={{
              position: 'absolute',
              ...dialogPosition,
              transition: 'all 0.3s ease-in-out',
              maxWidth: '400px',
              width: '90vw',
              zIndex: 1000,
            }}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {currentStep.title}
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                {currentStep.description}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-2">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 w-2 rounded-full ${
                      index === tutorialStep ? 'bg-blue-500' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    if (tutorialStep === tutorialSteps.length - 1) {
                      setShowTutorial(false);
                    } else {
                      setTutorialStep((prev) => prev + 1);
                    }
                  }}
                >
                  {tutorialStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-6">
      <TutorialDialog />
      <Toaster richColors closeButton position="bottom-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8" id="header">
          <h1 className="text-5xl font-bold text-white mb-3 flex items-center justify-center gap-4">
            <Brain className="text-blue-400" />
            Pandemic Minds
            <TrendingUp className="text-purple-400" />
          </h1>
          <p className="text-gray-300 text-xl">
            AI-Powered Social Contagion Analytics Dashboard
          </p>
          <Badge variant="outline" className="mt-2 text-lg px-4 py-1 text-white">
            Day {currentDay} • {networkSize} Agents • {selectedBelief.name}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT SIDE - ANALYTICS DASHBOARD */}
          <div className="space-y-6" id="charts-section">
            {/* Real-time Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-black/40 border-red-500/50 shadow-lg shadow-red-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Infected</p>
                      <p className="text-3xl font-bold text-red-400">{currentStats.infected}</p>
                      <p className="text-xs text-red-300">{((currentStats.infected / networkSize) * 100).toFixed(1)}%</p>
                    </div>
                    <Flame className="text-4xl text-red-500" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-black/40 border-green-500/50 shadow-lg shadow-green-500/20">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Trust Level</p>
                      <p className="text-3xl font-bold text-green-400">{Math.round(currentStats.trust)}%</p>
                      <p className="text-xs text-green-300">Society</p>
                    </div>
                    <Shield className="text-4xl text-green-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Time Series Chart */}
            <Card className="bg-black/40 border-purple-500/50 shadow-lg shadow-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="text-purple-400" />
                  Population Dynamics Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="day" stroke="#9ca3af" />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: 'white'
                        }} 
                      />
                      <Area type="monotone" dataKey="susceptible" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                      <Area type="monotone" dataKey="infected" stackId="1" stroke={selectedBelief.color} fill={selectedBelief.color} fillOpacity={0.8} />
                      <Area type="monotone" dataKey="resistant" stackId="1" stroke="#6b7280" fill="#6b7280" fillOpacity={0.6} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Current Distribution Pie Chart */}
            <Card className="bg-black/40 border-cyan-500/50 shadow-lg shadow-cyan-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="text-cyan-400" />
                  Current Population Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                        labelStyle={{ fill: 'white', fontSize: '12px' }}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                        }}
                        labelStyle={{
                          color: 'white'
                        }}
                        itemStyle={{
                          color: 'white'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Belief Radar Chart */}
            <Card className="bg-black/40 border-orange-500/50 shadow-lg shadow-orange-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Target className="text-orange-400" />
                  Active Belief Profile
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#9ca3af', fontSize: 12 }} />
                      <PolarRadiusAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                      <Radar
                        name="Belief Characteristics"
                        dataKey="A"
                        stroke={selectedBelief.color}
                        fill={selectedBelief.color}
                        fillOpacity={0.3}
                        strokeWidth={2}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: "white"
                        }} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Social Metrics */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-black/40 border-red-500/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-red-400 font-medium">Social Chaos</span>
                      <span className="text-white">{Math.round(currentStats.chaos)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, currentStats.chaos)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-black/40 border-purple-500/50">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-400 font-medium">Polarization</span>
                      <span className="text-white">{Math.round(currentStats.polarization)}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, currentStats.polarization)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Belief Comparison Chart */}
            <Card className="bg-black/40 border-yellow-500/50 shadow-lg shadow-yellow-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="text-yellow-400" />
                  Belief Characteristics Comparison
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={beliefComparisonData} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#9ca3af" 
                        angle={-45} 
                        textAnchor="end" 
                        height={100}
                        fontSize={10}
                      />
                      <YAxis stroke="#9ca3af" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1f2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px',
                          color: 'white'
                        }} 
                      />
                      <Bar dataKey="virality" fill="#ef4444" name="Virality" />
                      <Bar dataKey="stickiness" fill="#10b981" name="Stickiness" />
                      <Bar dataKey="resistance" fill="#f59e0b" name="Resistance" />
                      <Bar dataKey="polarization" fill="#8b5cf6" name="Polarization" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT SIDE - CONTROL PANEL */}
          <div className="space-y-6">
            {/* Simulation Controls */}
            <Card className="bg-black/40 border-blue-500/50 shadow-lg shadow-blue-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="text-blue-400" />
                  Simulation Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div id="network-size">
                    <label className="text-gray-300 text-sm font-medium">
                      Population Size: {networkSize} agents
                    </label>
                    <Slider
                      value={[networkSize]}
                      onValueChange={(value) => setNetworkSize(value[0])}
                      max={500}
                      min={50}
                      step={25}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div id="simulation-speed">
                    <label className="text-gray-300 text-sm font-medium">
                      Simulation Speed: {simulationSpeed}ms
                    </label>
                    <Slider
                      value={[simulationSpeed]}
                      onValueChange={(value) => setSimulationSpeed(value[0])}
                      max={1000}
                      min={100}
                      step={50}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2" id="control-buttons">
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    variant={isPlaying ? "destructive" : "default"}
                    className="w-full"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </Button>
                  
                  <Button
                    onClick={startOutbreak}
                    variant="secondary"
                    className="w-full"
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Outbreak
                  </Button>
                  
                  <Button
                    onClick={resetSimulation}
                    variant="outline"
                    className="w-full"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Belief Selection */}
            <Card className="bg-black/40 border-indigo-500/50 shadow-lg shadow-indigo-500/20" id="belief-selection">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Brain className="text-indigo-400" />
                  Belief Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="preset" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="preset">Preset Beliefs</TabsTrigger>
                    <TabsTrigger value="custom">Custom Beliefs</TabsTrigger>
                  </TabsList>
                  <TabsContent value="preset" className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {presetBeliefs.map((belief) => (
                        <Button
                          key={belief.id}
                          variant={selectedBelief.id === belief.id ? "default" : "outline"}
                          className="w-full justify-start text-left"
                          onClick={() => setSelectedBelief(belief)}
                        >
                          <span className="mr-2">{belief.icon}</span>
                          <span className="truncate">{belief.name}</span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                  <TabsContent value="custom" className="space-y-4">
                    <div className="space-y-4">
                      <Input
                        placeholder="Belief Name"
                        value={newBeliefName}
                        onChange={(e) => setNewBeliefName(e.target.value)}
                        style={{ color: 'white' }}
                      />
                      <ScrollArea className="h-[100px] rounded-md border" >
                        <Textarea
                          placeholder="Belief Description"
                          value={newBeliefText}
                          onChange={(e) => setNewBeliefText(e.target.value)}
                          className="min-h-[50px] w-full resize-none border-none focus:ring-0 focus:outline-none focus-visible:ring-0"
                          style={{
                            color: 'white',
                            background: 'transparent',
                          }}
                        />
                      </ScrollArea>
                      <Button
                        onClick={addCustomBelief}
                        className="w-full"
                        disabled={isLoadingAI || !apiKey}
                      >
                        {isLoadingAI ? (
                          "Analyzing..."
                        ) : (
                          <>
                            <Plus className="w-4 h-4 mr-1" />
                            Add Custom Belief
                          </>
                        )}
                      </Button>
                      <div className="flex items-center gap-2 p-4 mt-2 text-sm rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-600">
                        <TriangleAlert className="h-4 w-4" />
                        <p>Please add your API key in settings to create custom beliefs</p>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        {customBeliefs.map((belief) => (
                          <div key={belief.id} className="flex gap-2">
                            <Button
                              variant={selectedBelief.id === belief.id ? "default" : "outline"}
                              className="flex-1 justify-start text-left"
                              onClick={() => setSelectedBelief(belief)}
                            >
                              <span className="mr-2">{belief.icon}</span>
                              <span className="truncate">{belief.name}</span>
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => removeCustomBelief(belief.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* AI Settings */}
            <Card className="bg-black/40 border-emerald-500/50 shadow-lg shadow-emerald-500/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="text-emerald-400" />
                  AI Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-gray-300 text-sm font-medium">OpenAI API Key</label>
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ color: 'white' }}
                  />
                  <p className="text-xs text-gray-400">
                    Required for generating custom belief parameters using AI
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Warning Messages */}
            {currentStats.chaos > 75 && (
              <Card className="bg-red-900/40 border-red-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <AlertCircle className="text-red-500" />
                  <p className="text-red-200">
                    Warning: Social chaos levels are critically high!
                  </p>
                </CardContent>
              </Card>
            )}

            {currentStats.polarization > 75 && (
              <Card className="bg-purple-900/40 border-purple-500">
                <CardContent className="p-4 flex items-center gap-3">
                  <Activity className="text-purple-500" />
                  <p className="text-purple-200">
                    Alert: Society is approaching dangerous levels of polarization!
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PandemicMindsSimulator;
