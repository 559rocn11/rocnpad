import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Mic,
  Square,
  Play,
  Pause,
  RotateCcw,
  Check,
  Sparkles,
  AlertCircle,
  Languages,
  CheckSquare,
  Square as SquareOutline,
  Plus,
  Trash2,
  Calendar,
  Volume2,
  ArrowRight,
  Copy,
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { TaskItem } from '../types';

export interface ExtractedVoiceTask {
  id: string;
  text: string;
  due?: string | null;
  priority?: 'high' | 'normal' | 'low';
  selected: boolean;
}

interface VoiceRecorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voiceData: {
    audioUrl: string;
    duration: number;
    transcript: string;
    title?: string;
    tasks?: TaskItem[];
    translation?: string;
    targetLanguage?: string;
  }) => void;
}

const SUPPORTED_LANGUAGES = [
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Chinese (Simplified)', label: 'Chinese (中文)' },
  { code: 'Italian', label: 'Italian (Italiano)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
  { code: 'Arabic', label: 'Arabic (العربية)' },
  { code: 'Hindi', label: 'Hindi (हिन्दी)' },
  { code: 'Russian', label: 'Russian (Русский)' },
  { code: 'Korean', label: 'Korean (한국어)' },
  { code: 'Dutch', label: 'Dutch (Nederlands)' },
];

export const VoiceRecorderModal: React.FC<VoiceRecorderModalProps> = ({ isOpen, onClose, onSave }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState('');
  const [suggestedTitle, setSuggestedTitle] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Extracted Tasks State
  const [extractedTasks, setExtractedTasks] = useState<ExtractedVoiceTask[]>([]);
  const [isExtractingTasks, setIsExtractingTasks] = useState(false);
  const [newTaskInput, setNewTaskInput] = useState('');

  // Translation State
  const [targetLanguage, setTargetLanguage] = useState('Spanish');
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [activeTab, setActiveTab] = useState<'transcript' | 'translation' | 'both'>('transcript');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) {
      cleanup();
    }
  }, [isOpen]);

  const cleanup = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
    }
    setIsRecording(false);
    setRecordedAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setTranscript('');
    setSuggestedTitle('');
    setExtractedTasks([]);
    setTranslatedText('');
    setIsExtractingTasks(false);
    setIsTranslating(false);
    setIsTranscribing(false);
    setIsPlaying(false);
    setErrorMsg(null);
    setActiveTab('transcript');
  };

  const startVisualizer = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const render = () => {
        analyser.getByteFrequencyData(dataArray);
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * canvas.height * 0.85;
          ctx.fillStyle = isRecording ? '#3b82f6' : '#64748b';
          ctx.fillRect(x, canvas.height / 2 - barHeight / 2, barWidth - 2, Math.max(barHeight, 4));
          x += barWidth;
        }

        animationFrameRef.current = requestAnimationFrame(render);
      };
      render();
    } catch (e) {
      console.warn('Visualizer error:', e);
    }
  };

  // Live Speech Recognition initialization
  const startLiveSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = 0; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript + ' ';
          }
          if (currentTranscript.trim()) {
            setTranscript(currentTranscript.trim());
          }
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition warning:', e);
        };

        recognition.start();
        speechRecognitionRef.current = recognition;
      } catch (err) {
        console.warn('Live speech recognition start failed:', err);
      }
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    setTranscript('');
    setExtractedTasks([]);
    setTranslatedText('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      startVisualizer(stream);
      startLiveSpeechRecognition();

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);

        // Auto-transcribe using Gemini AI if speech recognition was empty or to clean up
        transcribeAudioBlob(blob, mimeType);

        // Stop media tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setDuration(0);

      timerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setErrorMsg('Microphone access denied or unsupported. Please check browser permissions.');
    }
  };

  const stopRecording = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch {}
    }
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const transcribeAudioBlob = async (blob: Blob, mimeType: string) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        if (base64Data) {
          const text = await aiService.transcribeAudio(base64Data, mimeType);
          const finalTranscript = (text && text.length > 5) ? text : transcript || 'Audio memo captured.';
          setTranscript(finalTranscript);
          // Automatically trigger task extraction
          triggerTaskExtraction(finalTranscript);
        } else {
          const finalTranscript = transcript.trim() || 'Audio memo captured.';
          setTranscript(finalTranscript);
          triggerTaskExtraction(finalTranscript);
        }
        setIsTranscribing(false);
      };
    } catch {
      const finalTranscript = transcript.trim() || 'Audio memo recorded.';
      setTranscript(finalTranscript);
      setIsTranscribing(false);
      triggerTaskExtraction(finalTranscript);
    }
  };

  // Trigger Gemini Task Extraction
  const triggerTaskExtraction = async (textToAnalyze: string) => {
    if (!textToAnalyze || textToAnalyze.trim().length < 5) return;
    setIsExtractingTasks(true);
    try {
      const result = await aiService.extractVoiceTasks(textToAnalyze);
      if (result.suggestedTitle) {
        setSuggestedTitle(result.suggestedTitle);
      }
      if (result.tasks && result.tasks.length > 0) {
        const mapped: ExtractedVoiceTask[] = result.tasks.map((t, idx) => ({
          id: `voice_task_${Date.now()}_${idx}`,
          text: t.text,
          due: t.due || null,
          priority: t.priority || 'normal',
          selected: true,
        }));
        setExtractedTasks(mapped);
      }
    } catch (err) {
      console.warn('Auto task extraction error:', err);
    } finally {
      setIsExtractingTasks(false);
    }
  };

  // Trigger Gemini Translation
  const handleTranslate = async () => {
    if (!transcript || transcript.trim().length === 0) return;
    setIsTranslating(true);
    try {
      const res = await aiService.translateText(transcript, targetLanguage);
      setTranslatedText(res.translatedText);
      setActiveTab('translation');
    } catch (err) {
      console.error('Translation error:', err);
    } finally {
      setIsTranslating(false);
    }
  };

  const toggleTaskSelection = (id: string) => {
    setExtractedTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const removeTask = (id: string) => {
    setExtractedTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddManualTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    const newTask: ExtractedVoiceTask = {
      id: `voice_task_manual_${Date.now()}`,
      text: newTaskInput.trim(),
      priority: 'normal',
      selected: true,
    };
    setExtractedTasks((prev) => [...prev, newTask]);
    setNewTaskInput('');
  };

  const togglePlayback = () => {
    if (!audioPlayerRef.current || !recordedAudioUrl) return;
    if (isPlaying) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleSave = () => {
    if (!recordedAudioUrl && !transcript) return;

    // Filter selected tasks to be saved directly
    const finalTasks: TaskItem[] = extractedTasks
      .filter((t) => t.selected)
      .map((t) => ({
        id: t.id,
        text: t.text,
        completed: false,
        due: t.due,
        priority: t.priority,
      }));

    // Compose final content based on selected tab or combined translation
    let finalContent = transcript.trim() || 'Voice memo capture.';
    if (activeTab === 'translation' && translatedText) {
      finalContent = `${translatedText}\n\n---\n*Original Transcript (${targetLanguage} translation above):*\n${transcript}`;
    } else if (activeTab === 'both' && translatedText) {
      finalContent = `### Transcript\n${transcript}\n\n### Translation (${targetLanguage})\n${translatedText}`;
    }

    const titleToUse =
      suggestedTitle ||
      `Voice Memo ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

    if (audioBlob) {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const fullDataUrl = reader.result as string;
        onSave({
          audioUrl: fullDataUrl,
          duration: duration || 5,
          transcript: finalContent,
          title: titleToUse,
          tasks: finalTasks.length > 0 ? finalTasks : undefined,
          translation: translatedText || undefined,
          targetLanguage: translatedText ? targetLanguage : undefined,
        });
        onClose();
      };
    } else {
      onSave({
        audioUrl: recordedAudioUrl || '',
        duration: duration || 5,
        transcript: finalContent,
        title: titleToUse,
        tasks: finalTasks.length > 0 ? finalTasks : undefined,
        translation: translatedText || undefined,
        targetLanguage: translatedText ? targetLanguage : undefined,
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const selectedTasksCount = extractedTasks.filter((t) => t.selected).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#12151c] border border-[#222838] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-[#202533] flex items-center justify-between bg-[#0e1017]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white font-display">ROCN Voice & Task Intelligence</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono-code">
                  Gemini 3.7
                </span>
              </div>
              <p className="text-[11px] text-[#94a3b8]">Live speech-to-text, actionable task extraction & multilingual translation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#94a3b8] hover:text-white p-1.5 rounded-lg hover:bg-[#1a1f2c] transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Recording / Playback Stage */}
          <div className="bg-[#0a0c10] border border-[#1e2433] rounded-xl p-4 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Waveform Visualizer */}
            <div className="w-full h-18 flex items-center justify-center mb-3">
              <canvas ref={canvasRef} width={500} height={70} className="w-full h-full" />
            </div>

            {/* Central Record / Control Cluster */}
            <div className="flex items-center justify-between w-full px-2">
              <div className="flex items-center gap-3">
                {recordedAudioUrl && (
                  <button
                    onClick={togglePlayback}
                    className="w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                )}
                <div>
                  <div className="text-xl font-mono-code font-bold tracking-tight text-white">
                    {formatTime(duration)}
                  </div>
                  <div className="text-[11px] text-[#64748b] font-mono-code">
                    {isRecording ? 'LIVE RECORDING...' : recordedAudioUrl ? 'AUDIO RECORDED' : 'READY'}
                  </div>
                </div>
              </div>

              {/* Main Record Button */}
              <div className="flex items-center gap-2">
                {!recordedAudioUrl ? (
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`px-5 py-2.5 rounded-full flex items-center gap-2 font-medium text-xs transition-all shadow-lg active:scale-95 ${
                      isRecording
                        ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/50 animate-pulse'
                        : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white hover:opacity-90 shadow-blue-900/50'
                    }`}
                  >
                    {isRecording ? (
                      <>
                        <Square className="w-4 h-4" />
                        <span>Stop & Analyze</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>Start Recording</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={startRecording}
                    className="px-3.5 py-2 rounded-lg border border-[#2b3345] bg-[#151922] hover:bg-[#1d2330] text-xs font-medium text-[#94a3b8] hover:text-white flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-record</span>
                  </button>
                )}
              </div>
            </div>

            <audio
              ref={audioPlayerRef}
              src={recordedAudioUrl || undefined}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
          </div>

          {/* Transcript & Translation Tab Controls */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1e2330] pb-2">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab('transcript')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    activeTab === 'transcript'
                      ? 'bg-[#1e2535] text-white border border-[#2c364d]'
                      : 'text-[#94a3b8] hover:text-white'
                  }`}
                >
                  Transcript
                </button>
                {translatedText && (
                  <>
                    <button
                      onClick={() => setActiveTab('translation')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        activeTab === 'translation'
                          ? 'bg-[#1e2535] text-amber-300 border border-amber-500/30'
                          : 'text-[#94a3b8] hover:text-amber-300'
                      }`}
                    >
                      {targetLanguage} Translation
                    </button>
                    <button
                      onClick={() => setActiveTab('both')}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        activeTab === 'both'
                          ? 'bg-[#1e2535] text-blue-300 border border-blue-500/30'
                          : 'text-[#94a3b8] hover:text-blue-300'
                      }`}
                    >
                      Side-by-Side
                    </button>
                  </>
                )}
              </div>

              {/* Translation Action Toolbar */}
              <div className="flex items-center gap-1.5">
                <select
                  value={targetLanguage}
                  onChange={(e) => setTargetLanguage(e.target.value)}
                  className="bg-[#0e1117] border border-[#232a3b] text-[#cbd5e1] text-xs rounded-md px-2 py-1 focus:outline-none"
                >
                  {SUPPORTED_LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleTranslate}
                  disabled={!transcript.trim() || isTranslating}
                  className="px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium flex items-center gap-1 transition-colors disabled:opacity-40"
                  title="Translate transcript"
                >
                  <Languages className="w-3.5 h-3.5" />
                  <span>{isTranslating ? 'Translating...' : 'Translate'}</span>
                </button>
              </div>
            </div>

            {/* Transcript & Translation Body */}
            {activeTab === 'transcript' && (
              <div className="relative">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Spoken speech transcription will stream here in real time..."
                  rows={4}
                  className="w-full bg-[#0a0c10] border border-[#1e2330] rounded-lg p-3 text-xs text-[#e2e8f0] focus:border-blue-500 focus:outline-none resize-none placeholder:text-[#475569] leading-relaxed"
                />
                {transcript && (
                  <button
                    onClick={() => handleCopy(transcript, 'transcript')}
                    className="absolute top-2 right-2 p-1 rounded bg-[#151922] text-[#94a3b8] hover:text-white text-[10px] flex items-center gap-1 border border-[#252c3c]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === 'transcript' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            )}

            {activeTab === 'translation' && (
              <div className="relative">
                <textarea
                  value={translatedText}
                  onChange={(e) => setTranslatedText(e.target.value)}
                  placeholder="Translated text will appear here..."
                  rows={4}
                  className="w-full bg-[#0a0c10] border border-amber-500/30 rounded-lg p-3 text-xs text-amber-100 focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
                />
                {translatedText && (
                  <button
                    onClick={() => handleCopy(translatedText, 'trans')}
                    className="absolute top-2 right-2 p-1 rounded bg-[#151922] text-[#94a3b8] hover:text-white text-[10px] flex items-center gap-1 border border-[#252c3c]"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedKey === 'trans' ? 'Copied' : 'Copy'}</span>
                  </button>
                )}
              </div>
            )}

            {activeTab === 'both' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] font-mono-code text-[#64748b] mb-1">Original Transcript</div>
                  <div className="bg-[#0a0c10] border border-[#1e2330] rounded-lg p-2.5 text-xs text-[#cbd5e1] max-h-32 overflow-y-auto leading-relaxed">
                    {transcript}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-mono-code text-amber-400 mb-1">
                    {targetLanguage} Translation
                  </div>
                  <div className="bg-[#0a0c10] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 max-h-32 overflow-y-auto leading-relaxed">
                    {translatedText}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actionable Tasks Extraction Engine */}
          <div className="bg-[#0c0e14] border border-[#1d222e] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckSquare className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">Extracted Action Items & Tasks</h4>
                  <p className="text-[10px] text-[#64748b]">
                    Tasks suggested by Gemini AI to automatically create upon saving
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerTaskExtraction(transcript)}
                  disabled={!transcript.trim() || isExtractingTasks}
                  className="px-2.5 py-1 rounded bg-[#161c28] hover:bg-[#20283a] text-[#94a3b8] hover:text-white border border-[#263145] text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
                >
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>{isExtractingTasks ? 'Extracting...' : 'Scan Tasks'}</span>
                </button>
              </div>
            </div>

            {/* Extracted Tasks List */}
            {extractedTasks.length > 0 ? (
              <div className="space-y-1.5">
                {extractedTasks.map((t) => (
                  <div
                    key={t.id}
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      t.selected
                        ? 'bg-[#141a24] border-blue-500/40 text-white'
                        : 'bg-[#090b0f] border-[#1a1f2c] text-[#64748b]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 mr-2">
                      <button
                        onClick={() => toggleTaskSelection(t.id)}
                        className="text-blue-400 hover:text-blue-300 shrink-0"
                      >
                        {t.selected ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <SquareOutline className="w-4 h-4 text-[#475569]" />
                        )}
                      </button>
                      <span className={`text-xs truncate ${t.selected ? 'text-[#e2e8f0]' : 'text-[#64748b] line-through'}`}>
                        {t.text}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {t.due && (
                        <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-[#182030] text-blue-300 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{t.due}</span>
                        </span>
                      )}
                      {t.priority === 'high' && (
                        <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20">
                          HIGH
                        </span>
                      )}
                      <button
                        onClick={() => removeTask(t.id)}
                        className="p-1 text-[#64748b] hover:text-rose-400 rounded transition-colors"
                        title="Remove task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-2 text-xs text-[#64748b] font-mono-code">
                {isExtractingTasks
                  ? 'Analyzing transcript with Gemini for action items...'
                  : 'No tasks extracted yet. Speak or type commitments like "need to review designs".'}
              </div>
            )}

            {/* Quick Manual Task Adder */}
            <form onSubmit={handleAddManualTask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                placeholder="+ Add another task manually..."
                className="flex-1 bg-[#090b0f] border border-[#1f2533] rounded-md px-2.5 py-1.5 text-xs text-white placeholder:text-[#475569] focus:border-blue-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newTaskInput.trim()}
                className="px-2.5 py-1.5 rounded-md bg-[#182030] hover:bg-[#222d42] text-xs text-blue-300 border border-[#2b374e] disabled:opacity-30"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#202533] flex flex-wrap items-center justify-between gap-2 bg-[#0e1017]">
          <div className="text-[11px] text-[#64748b] font-mono-code flex items-center gap-2">
            <span>{selectedTasksCount} task{selectedTasksCount === 1 ? '' : 's'} queued</span>
            {translatedText && <span className="text-amber-400">• {targetLanguage} attached</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs text-[#94a3b8] hover:text-white hover:bg-[#1a1f2c] font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!recordedAudioUrl && !transcript.trim()}
              className="px-4 py-1.5 rounded-lg text-xs bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-40"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Voice Memo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
