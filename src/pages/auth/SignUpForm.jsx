import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AuthAmbientBackground from '../../components/AuthAmbientBackground';
import Icon from '../../components/Icon';
import logo from '../../assets/screen.png';
import { COUNTRIES, DEFAULT_COUNTRY, validatePhone } from '../../data/countries';
import { sendOTP } from '../../services/authService';

export default function SignUpForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const { method } = useParams();
  const isPhone = method !== 'email';
  const initialTarget = location.state?.initialTarget || '';

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [email, setEmail] = useState(() => (!isPhone ? initialTarget : ''));
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState(() => {
    if (isPhone && initialTarget) {
      return initialTarget.replace(/\D/g, '').slice(-10);
    }
    return '';
  });
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [ripples, setRipples] = useState({});
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) setShowCountryPicker(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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

  const phoneResult = isPhone ? validatePhone(phone, country) : { valid: false, message: '' };
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const passwordsMatch = password && confirmPass && password === confirmPass;
  const passwordStrong = password.length >= 8;

  const filteredCountries = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.dial.includes(countrySearch) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  function handlePhoneChange(e) {
    setPhone(e.target.value.replace(/\D/g, '').slice(0, country.maxLength));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setApiError('');
    setLoading(true);

    const target = isPhone ? `${country.dial}${phone}` : email;

    try {
      await sendOTP({ target, purpose: 'signup' });
      navigate('/otp', {
        state: {
          target,
          purpose: 'signup',
          fullName: name,
          age: parseInt(age, 10),
          sex: gender,
          password,
        },
      });
    } catch (err) {
      console.error('Submit OTP error:', err);
      setApiError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const strength = getStrength(password);
  const isFormValid =
    name &&
    age &&
    gender &&
    (isPhone ? phoneResult.valid : emailValid) &&
    passwordStrong &&
    passwordsMatch;

  return (
    <AuthAmbientBackground showTicker={true}>
      <div className="w-full max-w-lg mx-auto px-3 sm:px-4 py-4 sm:py-8 flex flex-col items-center justify-center min-h-[calc(100vh-36px)]">
        
        {/* Main Glass Card - Mobile Responsive */}
        <main className="w-full bg-white/85 backdrop-blur-2xl border border-[#006972]/20 shadow-[0_24px_70px_-15px_rgba(0,105,114,0.22),0_0_0_1px_rgba(0,105,114,0.1)] rounded-2xl sm:rounded-3xl overflow-hidden animate-fade-up relative z-10 flex flex-col">
          
          {/* Top Bar */}
          <header className="w-full flex items-center justify-between px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
            <button
              onClick={() => navigate('/signup')}
              aria-label="Go back"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#006972]/5 hover:bg-[#006972]/15 border border-[#006972]/15 text-[#006972] transition-colors cursor-pointer active:scale-95"
            >
              <Icon name="arrow_back" size={20} />
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#006972]/10 text-[#006972] font-label text-[11px] font-bold border border-[#006972]/20">
              Step 2 of 2
            </span>
          </header>

          <div className="px-4 sm:px-8 pb-6 sm:pb-8 flex flex-col items-center">
            
            {/* Header / Natural Logo */}
            <div className="mb-4 sm:mb-6 flex flex-col items-center text-center">
              <img
                alt="Sanjhi Logo"
                src={logo}
                className="w-18 h-18 sm:w-24 sm:h-24 mb-2 object-contain drop-shadow-sm"
              />
              <h1 className="font-headline text-[24px] sm:text-[32px] font-bold text-deep-navy tracking-tight mb-1">
                Enter Details
              </h1>
              <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant max-w-xs">
                {isPhone
                  ? 'Sign up with your phone number for instant OTP setup.'
                  : 'Sign up with your email address for secure verification.'}
              </p>
            </div>

            {/* API Error Box */}
            {apiError && (
              <div className="w-full mb-4 p-3 sm:p-3.5 bg-rose-50 border border-rose-200 rounded-xl sm:rounded-2xl text-rose-700 text-[12px] sm:text-[13px] font-body flex items-start gap-2 animate-fade-in shadow-sm">
                <Icon name="error" size={18} className="shrink-0 mt-0.5 text-rose-600" />
                <span>{apiError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="w-full space-y-3.5 sm:space-y-4">
              
              {/* Full Name */}
              <div className="space-y-1 text-left">
                <label className="block font-label text-[12px] font-bold text-deep-navy">Full Name</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all">
                    <Icon name="person" size={18} />
                  </div>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full h-11 sm:h-12 pl-12 pr-4 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                  />
                </div>
              </div>

              {/* Age & Gender Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Age */}
                <div className="space-y-1 text-left">
                  <label className="block font-label text-[12px] font-bold text-deep-navy">Age</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-700 group-focus-within:bg-amber-500 group-focus-within:text-white transition-all">
                      <Icon name="cake" size={18} />
                    </div>
                    <input
                      type="number"
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value.replace(/\D/g, '').slice(0, 3))}
                      placeholder="e.g. 24"
                      className="w-full h-11 sm:h-12 pl-12 pr-2 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                    />
                  </div>
                </div>

                {/* Gender */}
                <div className="space-y-1 text-left">
                  <label className="block font-label text-[12px] font-bold text-deep-navy">Gender</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all">
                      <Icon name="wc" size={18} />
                    </div>
                    <select
                      required
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full h-11 sm:h-12 pl-12 pr-7 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[13px] sm:text-[14px] text-deep-navy outline-none cursor-pointer appearance-none shadow-sm"
                    >
                      <option value="" disabled>Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                      <Icon name="expand_more" size={18} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone or Email Input */}
              {isPhone ? (
                <div className="space-y-1 text-left" ref={pickerRef}>
                  <label className="block font-label text-[12px] font-bold text-deep-navy">Phone Number</label>
                  <div className="flex gap-2">
                    {/* Country Selector */}
                    <div className="relative w-1/3">
                      <button
                        type="button"
                        onClick={() => setShowCountryPicker(!showCountryPicker)}
                        className="w-full h-11 sm:h-12 px-2.5 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl flex items-center justify-between text-deep-navy focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 outline-none transition-all cursor-pointer shadow-sm"
                      >
                        <span className="flex items-center gap-1 font-bold text-[12px] sm:text-[13px]">
                          {country.flag ? (
                            <img src={country.flag} alt="" className="w-4.5 h-3.5 object-cover rounded-sm" />
                          ) : (
                            '🇵🇰'
                          )}
                          {country.dial}
                        </span>
                        <Icon name="expand_more" size={15} className="text-on-surface-variant" />
                      </button>

                      {/* Dropdown Modal */}
                      {showCountryPicker && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#006972]/20 rounded-2xl shadow-2xl z-50 overflow-hidden animate-slide-down">
                          <div className="p-2 border-b border-[#006972]/10 bg-slate-50">
                            <input
                              type="text"
                              placeholder="Search..."
                              value={countrySearch}
                              onChange={(e) => setCountrySearch(e.target.value)}
                              className="w-full bg-white border border-[#006972]/20 rounded-xl px-2.5 py-1 text-xs outline-none focus:border-[#006972]"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-40 overflow-y-auto">
                            {filteredCountries.map((c) => (
                              <button
                                key={c.code + c.dial}
                                type="button"
                                onClick={() => {
                                  setCountry(c);
                                  setPhone('');
                                  setShowCountryPicker(false);
                                  setCountrySearch('');
                                }}
                                className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-[#006972]/10 text-left text-xs transition-colors"
                              >
                                <img src={c.flag} alt="" className="w-4 h-3 object-cover rounded-sm" />
                                <span className="flex-1 truncate font-medium">{c.name}</span>
                                <span className="text-on-surface-variant font-bold">{c.dial}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Phone Input */}
                    <div className="relative w-2/3 group">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all">
                        <Icon name="smartphone" size={18} />
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="300 1234567"
                        maxLength={country.maxLength}
                        className="w-full h-11 sm:h-12 pl-12 pr-3 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                      />
                    </div>
                  </div>
                  {phone && phoneResult.message && (
                    <p
                      className={`text-[11px] sm:text-[12px] font-semibold mt-1 ml-1 ${
                        phoneResult.valid ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {phoneResult.valid ? '✓ ' : ''}
                      {phoneResult.message}
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-1 text-left">
                  <label className="block font-label text-[12px] font-bold text-deep-navy">Email Address</label>
                  <div className="relative group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all">
                      <Icon name="mail" size={18} />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="w-full h-11 sm:h-12 pl-12 pr-4 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className="space-y-1 text-left">
                <label className="block font-label text-[12px] font-bold text-deep-navy">Password</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all">
                    <Icon name="lock" size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full h-11 sm:h-12 pl-12 pr-11 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-on-surface-variant hover:text-[#006972] transition-colors cursor-pointer"
                  >
                    <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>
              </div>

              {/* Password Strength Visual Meter */}
              {password && (
                <div className="space-y-1 px-1">
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map((level) => {
                      const active = strength >= level;
                      const colors = ['bg-rose-500', 'bg-amber-500', 'bg-amber-400', 'bg-emerald-600'];
                      return (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            active ? colors[strength - 1] : 'bg-[#006972]/10'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="text-[11px] font-semibold text-right text-on-surface-variant">
                    Strength: {['Weak', 'Fair', 'Good', 'Strong'][Math.max(0, strength - 1)]}
                  </p>
                </div>
              )}

              {/* Confirm Password */}
              <div className="space-y-1 text-left">
                <label className="block font-label text-[12px] font-bold text-deep-navy">Confirm Password</label>
                <div className="relative group">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#006972]/10 flex items-center justify-center text-[#006972] group-focus-within:bg-[#006972] group-focus-within:text-white transition-all">
                    <Icon name="lock_reset" size={18} />
                  </div>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full h-11 sm:h-12 pl-12 pr-11 bg-white border border-[#006972]/20 rounded-xl sm:rounded-2xl focus:border-[#006972] focus:ring-4 focus:ring-[#006972]/10 transition-all font-body text-[14px] text-deep-navy outline-none shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-on-surface-variant hover:text-[#006972] transition-colors cursor-pointer"
                  >
                    <Icon name={showConfirm ? 'visibility_off' : 'visibility'} size={18} />
                  </button>
                </div>

                {confirmPass && !passwordsMatch && (
                  <p className="text-[11px] sm:text-[12px] font-medium text-rose-600 ml-1">Passwords don't match</p>
                )}
                {confirmPass && passwordsMatch && (
                  <p className="text-[11px] sm:text-[12px] font-medium text-emerald-600 ml-1">✓ Passwords match</p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || loading}
                onClick={(e) => triggerRipple(e, 'create')}
                className="relative overflow-hidden w-full bg-[#006972] hover:bg-[#00575f] text-white py-3.5 px-6 rounded-xl sm:rounded-2xl font-label text-[15px] font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98] duration-200 mt-4 shadow-lg shadow-[#006972]/25 hover:shadow-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed border-none"
              >
                {ripples.create && (
                  <span
                    className="absolute rounded-full bg-white/30 w-32 h-32 -translate-x-1/2 -translate-y-1/2 animate-ping pointer-events-none"
                    style={{ left: ripples.create.x, top: ripples.create.y }}
                  />
                )}
                {loading ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Create Account & Send Code
                    <Icon name="arrow_forward" size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-5 flex flex-col items-center gap-2">
              <p className="font-body text-[13px] sm:text-[14px] text-on-surface-variant">
                Already have an account?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-[#006972] font-bold hover:underline underline-offset-4 bg-transparent border-none cursor-pointer"
                >
                  Log in
                </button>
              </p>
              <button
                onClick={() => navigate(isPhone ? '/signup/email' : '/signup/phone')}
                className="font-label text-[12px] sm:text-[13px] font-semibold text-[#006972] hover:underline flex items-center gap-1 transition-colors bg-transparent border-none cursor-pointer"
              >
                <Icon name="swap_horiz" size={16} />
                {isPhone ? 'Use email address instead' : 'Use phone number instead'}
              </button>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="bg-[#006972]/8 border-t border-[#006972]/15 p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#006972]/15 text-[#006972] flex items-center justify-center shrink-0">
              <Icon name="verified_user" size={18} />
            </div>
            <div className="text-left">
              <h4 className="font-headline text-[12px] sm:text-[13px] font-bold text-deep-navy">Verified Community Savings</h4>
              <p className="font-body text-[10px] sm:text-[11px] text-on-surface-variant leading-tight">
                Authentic profiles help keep your committee savings safe and secure.
              </p>
            </div>
          </div>
        </main>
      </div>
    </AuthAmbientBackground>
  );
}

function getStrength(pw) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return s;
}
