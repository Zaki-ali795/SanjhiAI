import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import { parseCommitteeAIAudio, parseCommitteeAIText } from '../../services/committeeService';
import Icon from '../../components/Icon';

export default function CreateCommittee() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialData = location.state || {};

  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiMode, setIsAiMode] = useState(true);
  const [name, setName] = useState(initialData.name || '');
  const [contribution, setContribution] = useState(initialData.contribution || '5000');
  const [capacity, setCapacity] = useState(initialData.capacity || '10');
  const [isPublic, setIsPublic] = useState(initialData.is_public || false);
  const [category, setCategory] = useState(initialData.category || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [rules, setRules] = useState(initialData.rules || '');
  const [isParsing, setIsParsing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [ripples, setRipples] = useState({});

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        handleAudioUpload(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Recording failed:', err);
      alert('Microphone access denied or failed.');
    }
  }

  function stopRecording() {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  }

  async function handleAudioUpload(audioBlob) {
    setIsParsing(true);
    const formData = new FormData();
    formData.append('audio', audioBlob, 'prompt.webm');
    
    try {
      const data = await parseCommitteeAIAudio(formData);
      
      // Update the textarea with the transcription
      if (data.transcript) {
        setAiPrompt(data.transcript);
      }
      
      // Populate fields from parsed JSON
      if (data.parsed) {
        setName(data.parsed.name || '');
        setContribution(data.parsed.contribution_amount?.toString() || '');
        setCapacity(data.parsed.capacity?.toString() || '');
      }
    } catch (err) {
      console.error('Parsing failed:', err);
      alert('Failed to process audio. Please try again.');
    } finally {
      setIsParsing(false);
    }
  }

  function triggerRipple(e, key) {
    const rect = e.currentTarget.getBoundingClientRect();
    setRipples((prev) => ({
      ...prev,
      [key]: { x: e.clientX - rect.left, y: e.clientY - rect.top, k: Date.now() },
    }));
    setTimeout(() => {
      setRipples((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 600);
  }

  async function handleAiParse() {
    if (!aiPrompt.trim()) return;
    setIsParsing(true);
    
    try {
      const data = await parseCommitteeAIText({ text: aiPrompt });
      
      if (data.parsed) {
        setName(data.parsed.name || '');
        setContribution(data.parsed.contribution_amount?.toString() || '');
        setCapacity(data.parsed.capacity?.toString() || '');
      }
    } catch (err) {
      console.error('Text parsing failed:', err);
      alert('Failed to process text. Please try again.');
    } finally {
      setIsParsing(false);
    }
  }

  const numMembers = parseInt(capacity, 10) || 0;
  const monthlyContrib = parseInt(contribution, 10) || 0;
  const totalPool = numMembers * monthlyContrib;

  function handleContinue(e) {
    triggerRipple(e, 'continue');
    navigate('/committee/schedule', {
      state: {
        ...initialData,
        name: name || 'Sanjhi Savings Pool',
        contribution: monthlyContrib,
        capacity: numMembers,
        is_public: isPublic,
        category,
        description,
        rules,
      },
    });
  }

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-2xl mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)] pb-28 md:pb-12">
        
        {/* Main Glass Card matching User Dashboard */}
        <main className="max-w-2xl w-full bg-white rounded-2xl border border-[#006972]/15 shadow-[0_4px_20px_rgba(0,0,0,0.05)] overflow-hidden p-6 sm:p-10 animate-fade-up relative z-10">
          
          {/* Header Navigation & Step Indicator */}
          <header className="w-full flex items-center justify-between mb-8">
            <button
              onClick={() => navigate('/dashboard')}
              aria-label="Go to Dashboard"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="arrow_back" size={20} />
            </button>

            <div className="text-center flex-1">
              <h1 className="font-headline text-[24px] font-bold text-deep-navy mb-1">
                Create a Committee
              </h1>
              <p className="font-label text-[12px] text-on-surface-variant">
                Step 1 of 4: Basic Information
              </p>
            </div>

            <span className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 text-[#006972] font-label text-[14px] font-bold">
              1/4
            </span>
          </header>

          {/* Progress Bar */}
          <div className="w-full bg-[#006972]/10 h-2 rounded-full mb-8 overflow-hidden">
            <div className="bg-[#006972] h-full w-1/4 rounded-full transition-all duration-500" />
          </div>

          {/* AI Setup Assistant Card */}
          <section className="gradient-border-card p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-[#006972] font-label text-[14px] font-bold">
                <Icon name="auto_awesome" size={18} className="text-[#006972] animate-pulse" />
                AI Fast Setup
              </div>
              <button
                type="button"
                onClick={() => setIsAiMode(!isAiMode)}
                className="font-label text-[12px] text-on-surface-variant hover:text-[#006972] transition-colors flex items-center gap-1"
              >
                <Icon name={isAiMode ? 'visibility_off' : 'auto_awesome'} size={16} />
                {isAiMode ? 'Hide AI Helper' : 'Use AI Helper'}
              </button>
            </div>

            {isAiMode && (
              <div className="relative bg-[#006972]/5 rounded-xl p-4 mb-4 border border-[#006972]/10">
                <textarea
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe your committee in plain words, e.g. 10 friends, Rs. 5000 monthly, starting next month..."
                  className="w-full bg-transparent border-none p-0 focus:ring-0 resize-none text-deep-navy placeholder:text-on-surface-variant/60 font-body text-[16px] h-24 outline-none"
                />
              </div>
            )}
            
            {isAiMode && (
              <div className="flex items-center justify-between mt-4">
                {/* Auto Fill Details */}
                <button
                  type="button"
                  onClick={handleAiParse}
                  disabled={isParsing || !aiPrompt.trim()}
                  className="bg-[#006972]/30 text-[#006972] hover:bg-[#006972]/40 transition-colors px-4 py-2 rounded-full font-label text-[12px] font-bold flex items-center gap-2 disabled:opacity-50"
                >
                  <Icon name="magic_button" size={16} />
                  Auto Fill Details
                </button>
                
                {/* Mic Circle */}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-md ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#006972] text-white hover:bg-[#00575f]'}`}
                >
                  <Icon name={isRecording ? 'stop' : 'mic'} size={24} />
                </button>
              </div>
            )}
          </section>

          {/* Divider */}
          <div className="relative flex items-center py-5 mb-4">
            <div className="flex-grow border-t border-[#006972]/30"></div>
            <span className="flex-shrink-0 mx-4 text-on-surface-variant font-label text-[12px] uppercase tracking-wider">Form Details</span>
            <div className="flex-grow border-t border-[#006972]/30"></div>
          </div>

          {/* Form Fields */}
          <form onSubmit={(e) => { e.preventDefault(); handleContinue(e); }} className="space-y-6 mb-8">
            
            {/* Committee Name */}
            <div>
              <label htmlFor="committee-name" className="block font-label text-[14px] text-deep-navy mb-2">
                Committee Name
              </label>
              <div className="relative flex items-center">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <div className="w-8 h-8 rounded bg-[#d6e4f9]/40 flex items-center justify-center">
                    <Icon name="label" size={18} className="text-[#006972]" />
                  </div>
                </div>
                <input
                  id="committee-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Diwali Savings Fund 2026"
                  className="block w-full pl-14 pr-3 py-3 border border-[#c4c6cc] rounded-xl bg-[#f5f4e8] focus:ring-[#000000] focus:border-[#000000] transition-colors text-deep-navy outline-none"
                />
              </div>
            </div>

            {/* Grid: Contribution & Member Capacity */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Monthly Contribution */}
              <div>
                <label htmlFor="contribution" className="block font-label text-[14px] text-deep-navy mb-2">
                  Monthly Contribution
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="font-label text-[14px] text-[#006972] ml-1">Rs.</span>
                  </div>
                  <input
                    id="contribution"
                    type="number"
                    required
                    min={100}
                    value={contribution}
                    onChange={(e) => setContribution(e.target.value.replace(/\D/g, ''))}
                    placeholder="5000"
                    className="block w-full pl-12 pr-3 py-3 border border-[#c4c6cc] rounded-xl bg-[#f5f4e8] focus:ring-[#000000] focus:border-[#000000] transition-colors text-deep-navy outline-none"
                  />
                </div>
              </div>

              {/* Number of Members */}
              <div>
                <label htmlFor="capacity" className="block font-label text-[14px] text-deep-navy mb-2">
                  Member Capacity
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="group" size={20} className="text-[#006972] ml-1" />
                  </div>
                  <input
                    id="capacity"
                    type="number"
                    required
                    min={2}
                    max={50}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value.replace(/\D/g, ''))}
                    placeholder="10"
                    className="block w-full pl-12 pr-3 py-3 border border-[#c4c6cc] rounded-xl bg-[#f5f4e8] focus:ring-[#000000] focus:border-[#000000] transition-colors text-deep-navy outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Public Marketplace Toggle */}
            <div className="flex items-center justify-between p-4 rounded-xl border border-[#c4c6cc] bg-[#f5f4e8]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#006972]/10 flex items-center justify-center text-[#006972]">
                  <Icon name="public" size={20} />
                </div>
                <div>
                  <p className="font-label text-[14px] text-deep-navy font-semibold">List on Public Marketplace</p>
                  <p className="font-body text-[12px] text-on-surface-variant/80">
                    Anyone can discover and request to join. Requires CNIC verification.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPublic((v) => !v)}
                className={`relative w-12 h-7 rounded-full transition-colors ${isPublic ? 'bg-[#006972]' : 'bg-[#c4c6cc]'}`}
                aria-label="Toggle public marketplace"
              >
                <span
                  className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${
                    isPublic ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Category */}
            {isPublic && (
              <div>
                <label htmlFor="category" className="block font-label text-[14px] text-deep-navy mb-2">
                  Category
                </label>
                <div className="relative flex items-center">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icon name="category" size={20} className="text-[#006972] ml-1" />
                  </div>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full pl-12 pr-3 py-3 border border-[#c4c6cc] rounded-xl bg-[#f5f4e8] focus:ring-[#000000] focus:border-[#000000] transition-colors text-deep-navy outline-none appearance-none"
                  >
                    <option value="">Select a category</option>
                    <option value="savings">Savings</option>
                    <option value="education">Education</option>
                    <option value="wedding">Wedding</option>
                    <option value="emergency">Emergency</option>
                    <option value="business">Business</option>
                    <option value="travel">Travel</option>
                    <option value="health">Health</option>
                  </select>
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <label htmlFor="description" className="block font-label text-[14px] text-deep-navy mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the purpose of this committee…"
                className="block w-full px-4 py-3 border border-[#c4c6cc] rounded-xl bg-[#f5f4e8] focus:ring-[#000000] focus:border-[#000000] transition-colors text-deep-navy outline-none resize-none"
              />
            </div>

            {/* Rules */}
            <div>
              <label htmlFor="rules" className="block font-label text-[14px] text-deep-navy mb-2">
                Rules / Notes
              </label>
              <textarea
                id="rules"
                rows={2}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="Any specific rules members should know…"
                className="block w-full px-4 py-3 border border-[#c4c6cc] rounded-xl bg-[#f5f4e8] focus:ring-[#000000] focus:border-[#000000] transition-colors text-deep-navy outline-none resize-none"
              />
            </div>
          </form>

          {/* Info Box */}
          <div className="bg-[#a1eff9]/20 rounded-xl p-5 mb-8 flex gap-4 items-start border border-[#a1eff9]/30">
            <div className="w-10 h-10 rounded-full bg-[#9eecf6] flex-shrink-0 flex items-center justify-center text-[#0c6d76] mt-1">
              <Icon name="account_balance_wallet" size={24} />
            </div>
            <div>
              <h4 className="font-label text-[14px] text-deep-navy mb-1">Total Pool Expected per Cycle</h4>
              <p className="font-body text-[14px] text-on-surface-variant/80">
                With <strong className="font-bold text-[#006972]">{numMembers || 0} members</strong> contributing{' '}
                <strong className="font-bold text-[#006972]">Rs. {monthlyContrib.toLocaleString()}</strong> each, the total monthly payout pool is{' '}
                <strong className="font-bold text-[#006972]">Rs. {totalPool.toLocaleString()}</strong>.
              </p>
            </div>
          </div>

          {/* Submit / Continue Button */}
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); handleContinue(e); }}
            className="w-full bg-[#000000] hover:bg-[#3a4859] text-[#ffffff] font-label text-[14px] py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            Continue to Schedule
            <Icon name="arrow_forward" size={20} />
          </button>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}
