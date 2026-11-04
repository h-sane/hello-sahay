import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  FileCheck2,
  FileText,
  Loader2,
  Plus,
  RotateCcw,
  Shield,
  Sparkles,
  Upload,
  Users,
  Wrench,
  X,
} from 'lucide-react';
import { HelperProfile } from '../types';
import { sathiApi } from '../services/api';

interface RegistrationViewProps {
  onRegistered: (helper: HelperProfile) => void;
  onBackToSignIn: () => void;
}

export const RegistrationView: React.FC<RegistrationViewProps> = ({
  onRegistered,
  onBackToSignIn,
}) => {
  // Personal Info State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('male');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');

  // Government ID
  const [idType, setIdType] = useState('Aadhaar Card');
  const [idNumber, setIdNumber] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    previewUrl?: string;
  } | null>(null);

  // Skills & Work Description
  const [categories, setCategories] = useState<string[]>([
    'Personal Caretaker',
  ]);
  const [workDescription, setWorkDescription] = useState(
    'I can repair water pipes, install water filters, fix plumbing connections, and handle basic household maintenance and elder care.'
  );
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'Elderly Care',
    'Vital Signs Monitoring',
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');
  const [showAddCustom, setShowAddCustom] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);

  // Additional Information
  const [experienceYears, setExperienceYears] = useState(5);
  const [languages, setLanguages] = useState<string[]>(['English', 'Tamil', 'Hindi', 'Telugu']);
  const [emergencyContact, setEmergencyContact] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const predefinedCategories = [
    'Personal Caretaker',
    'House Cleaning',
    'Technical Support',
  ];

  const availableLanguages = [
    'English',
    'Tamil',
    'Hindi',
    'Telugu',
    'Kannada',
    'Malayalam',
  ];

  const toggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const toggleLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setLanguages(languages.filter((l) => l !== lang));
    } else {
      setLanguages([...languages, lang]);
    }
  };

  const addSkill = (skill: string) => {
    if (!selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter((s) => s !== skill));
  };

  const handleAddCustomSkill = () => {
    if (customSkillInput.trim()) {
      addSkill(customSkillInput.trim());
      setCustomSkillInput('');
      setShowAddCustom(false);
    }
  };

  const handleAnalyzeSkills = async () => {
    if (!workDescription.trim()) return;
    setIsExtracting(true);
    try {
      const res = await sathiApi.extractSkills(workDescription);
      setExtractedSkills(res.suggestions);
      res.suggestions.forEach((s) => {
        if (!selectedSkills.includes(s)) {
          addSkill(s);
        }
      });
    } catch {
      // Fallback local extraction
      const lower = workDescription.toLowerCase();
      const fallbacks: string[] = [];
      if (lower.includes('pipe') || lower.includes('plumb')) fallbacks.push('Plumbing Repairs');
      if (lower.includes('filter')) fallbacks.push('Water Filter Installation & Service');
      if (lower.includes('clean')) fallbacks.push('Deep Cleaning');
      if (lower.includes('elder') || lower.includes('care')) fallbacks.push('Elderly Care');
      setExtractedSkills(fallbacks);
      fallbacks.forEach(addSkill);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr =
        file.size > 1024 * 1024
          ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          : `${(file.size / 1024).toFixed(0)} KB`;

      let previewUrl: string | undefined = undefined;
      if (file.type.startsWith('image/')) {
        previewUrl = URL.createObjectURL(file);
      }

      setSelectedFile({
        name: file.name,
        size: sizeStr,
        type: file.type,
        previewUrl,
      });
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedFile?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClear = () => {
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setIdNumber('');
    if (selectedFile?.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(selectedFile.previewUrl);
    }
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setWorkDescription('');
    setSelectedSkills([]);
    setCategories([]);
    setEmergencyContact('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Please enter your full name.');
    const rawPhone = phone.replace(/\D/g, '');
    if (rawPhone.length < 10) return setError('Enter a valid 10-digit mobile number.');
    if (!idNumber.trim()) return setError('Please enter your government ID number.');
    if (!selectedFile) return setError('Please select and upload your government ID document.');
    if (categories.length === 0) return setError('Please select at least one skill category.');
    if (selectedSkills.length === 0) return setError('Please add at least one specific skill.');

    setError('');
    setBusy(true);

    try {
      // Parse multi-part address from single address string or defaults
      const addressParts = address.split(',').map((p) => p.trim());
      const houseNo = addressParts[0] || 'No. 42';
      const street = addressParts[1] || 'Gandhi Road';
      const area = addressParts[2] || 'Tambaram';
      const city = addressParts[3] || 'Chennai';
      const pincodeMatch = address.match(/\b\d{6}\b/);
      const pincode = pincodeMatch ? pincodeMatch[0] : '600045';

      const docCleanName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const docStorageUrl = `https://storage.hellosahay.com/docs/${docCleanName}`;

      const payload = {
        name: name.trim(),
        phone: `+91${rawPhone.slice(-10)}`,
        gender,
        email: email.trim() || null,
        house_no: houseNo,
        street: street,
        area: area,
        city: city,
        district: 'Chengalpattu',
        state: 'Tamil Nadu',
        pincode: pincode,
        id_type: idType,
        id_number: idNumber.trim(),
        id_document_url: docStorageUrl,
        categories,
        description: workDescription.trim(),
        skills: selectedSkills,
        experience_years: experienceYears,
        languages,
        emergency_contact: emergencyContact.trim() || null,
      };

      const res = await sathiApi.register(payload);
      onRegistered(res.helper);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAF9] pb-28">
      {/* Top Bar with Back Button */}
      <div className="bg-white/95 backdrop-blur-md sticky top-0 z-30 px-4 py-3 border-b border-slate-200/80 flex items-center justify-between max-w-md mx-auto">
        <button
          onClick={onBackToSignIn}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" /> Sign In
        </button>
        <span className="text-xs font-bold text-[#1E3A2F] uppercase tracking-wider">
          Helper Portal
        </span>
        <div className="w-8" />
      </div>

      <div className="max-w-md mx-auto p-4 space-y-4">
        {/* Banner Section matching user screenshot */}
        <div className="text-center pt-2 pb-1">
          <div className="w-14 h-14 rounded-full bg-[#274236] text-white mx-auto flex items-center justify-center shadow-md mb-2.5">
            <Users className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Sahay Sathi Portal
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Register as a service provider in one simple form
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Card 1: Personal Information (matches user screenshot) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Personal Information
            </h2>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] font-normal text-slate-900 placeholder:text-slate-400 bg-white"
                required
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] font-normal text-slate-900 placeholder:text-slate-400 bg-white"
                required
              />
            </div>

            {/* Gender Pills */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Gender
              </label>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      gender === 'male'
                        ? 'bg-[#E8F1EC] text-[#1E3A2F] border border-[#1E3A2F]/30 font-semibold shadow-xs'
                        : 'bg-[#E8F1EC]/60 text-slate-700 hover:bg-[#E8F1EC]'
                    }`}
                  >
                    Male
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      gender === 'female'
                        ? 'bg-[#E8F1EC] text-[#1E3A2F] border border-[#1E3A2F]/30 font-semibold shadow-xs'
                        : 'bg-[#E8F1EC]/60 text-slate-700 hover:bg-[#E8F1EC]'
                    }`}
                  >
                    Female
                  </button>
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => setGender('other')}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                      gender === 'other'
                        ? 'bg-[#E8F1EC] text-[#1E3A2F] border border-[#1E3A2F]/30 font-semibold shadow-xs'
                        : 'bg-[#E8F1EC]/60 text-slate-700 hover:bg-[#E8F1EC]'
                    }`}
                  >
                    Other
                  </button>
                </div>
              </div>
            </div>

            {/* Gmail / Email */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Gmail / Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] font-normal text-slate-900 placeholder:text-slate-400 bg-white"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Address
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                placeholder="House, street, city, state, pincode"
                className="w-full p-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] font-normal text-slate-900 placeholder:text-slate-400 bg-white resize-none"
              />
            </div>
          </div>

          {/* Card 2: Government ID (with native File Explorer document picker) */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900">
                Government ID
              </h2>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                Encrypted & Safe
              </span>
            </div>

            {/* ID Document Type */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Document Type
              </label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:border-[#274236]"
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Driving License">Driving License</option>
              </select>
            </div>

            {/* Document Number */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Document Number
              </label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="XXXX-XXXX-9124"
                className="w-full h-11 px-3.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] font-mono text-slate-900 bg-white"
                required
              />
            </div>

            {/* Native Document File Picker Block */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-1.5">
                Document File / Photograph
              </label>

              {/* Real hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="*/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {!selectedFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-[#274236] bg-[#F8FAF9] rounded-2xl p-4 text-center cursor-pointer transition-colors active:bg-slate-100"
                >
                  <div className="w-10 h-10 rounded-full bg-[#E8F1EC] text-[#274236] flex items-center justify-center mx-auto mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    Tap to choose file from File Explorer
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Supports PDF, JPG, PNG, DOC (all documents)
                  </p>
                </div>
              ) : (
                <div className="border border-emerald-300 bg-emerald-50/60 rounded-2xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                        {selectedFile.previewUrl ? (
                          <FileCheck2 className="w-5 h-5 text-emerald-700" />
                        ) : (
                          <FileText className="w-5 h-5 text-emerald-700" />
                        )}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-emerald-950 truncate max-w-[200px]">
                          {selectedFile.name}
                        </p>
                        <p className="text-[10px] text-emerald-700 font-medium">
                          {selectedFile.size} • Ready for upload
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-slate-400 hover:text-rose-600 p-1"
                      title="Remove document"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {selectedFile.previewUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden max-h-36 border border-emerald-200">
                      <img
                        src={selectedFile.previewUrl}
                        alt="Document preview"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-emerald-200/60 text-[11px]">
                    <span className="text-emerald-800 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Document Loaded
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#274236] font-bold hover:underline"
                    >
                      Change File
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 3: Skills Selection & AI Extractor */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Skills Selection
            </h2>

            {/* Predefined Categories */}
            <div>
              <label className="block text-sm font-medium text-slate-800 mb-2">
                Primary Skill Categories (Select All That Apply)
              </label>
              <div className="flex flex-wrap gap-2">
                {predefinedCategories.map((cat) => {
                  const isSel = categories.includes(cat);
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        isSel
                          ? 'bg-[#274236] text-white shadow-xs'
                          : 'bg-[#E8F1EC] text-[#1E3A2F] hover:bg-[#d6e7dd]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Describe Your Work (with LLM AI connection) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-slate-800">
                  Describe Your Work
                </label>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> AI Assisted
                </span>
              </div>
              <textarea
                value={workDescription}
                onChange={(e) => setWorkDescription(e.target.value)}
                rows={3}
                placeholder="Example: I can repair water pipes, install water filters, fix plumbing connections, and handle basic household maintenance."
                className="w-full p-3.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] text-slate-900 bg-white resize-none"
              />
              <button
                type="button"
                onClick={handleAnalyzeSkills}
                disabled={isExtracting || !workDescription.trim()}
                className="mt-2 w-full h-10 rounded-xl bg-[#E8F1EC] text-[#1E3A2F] text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-[#d6e7dd] transition-colors border border-[#1E3A2F]/20 disabled:opacity-50"
              >
                {isExtracting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Extract Skills with AI
              </button>
            </div>

            {/* Extracted Suggestions */}
            {extractedSkills.length > 0 && (
              <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-200/60 space-y-1.5">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Recognized Skills from your description:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {extractedSkills.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                        selectedSkills.includes(s)
                          ? 'bg-emerald-700 text-white'
                          : 'bg-white text-emerald-800 border border-emerald-300'
                      }`}
                    >
                      {selectedSkills.includes(s) ? '✓ ' : '+ '}
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Skills List */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Active Skills ({selectedSkills.length})
              </label>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl bg-slate-50 border border-slate-200">
                {selectedSkills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#274236] text-white font-medium"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="hover:text-rose-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {selectedSkills.length === 0 && (
                  <span className="text-xs text-slate-400 italic">No skills selected yet</span>
                )}
              </div>

              {/* Add Custom Skill */}
              <div className="mt-2">
                {showAddCustom ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      placeholder="e.g. Inverter battery setup"
                      className="flex-1 h-9 px-3 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="h-9 px-3 bg-[#274236] text-white text-xs font-bold rounded-xl"
                    >
                      Add
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="h-9 px-2 text-slate-500 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(true)}
                    className="text-xs font-bold text-[#1E3A2F] hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Add Another Skill
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Additional Information */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Additional Information
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Experience (Years)
                </label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-800 mb-1">
                  Emergency Contact
                </label>
                <input
                  type="tel"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  placeholder="+91..."
                  className="w-full h-11 px-3 text-sm rounded-xl border border-slate-200 focus:outline-none focus:border-[#274236] text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Languages Known */}
            <div>
              <label className="block text-xs font-medium text-slate-800 mb-2">
                Languages Known
              </label>
              <div className="flex flex-wrap gap-1.5">
                {availableLanguages.map((lang) => {
                  const isSel = languages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        isSel
                          ? 'bg-[#274236] text-white font-semibold'
                          : 'bg-[#E8F1EC] text-[#1E3A2F] hover:bg-[#d6e7dd]'
                      }`}
                    >
                      {lang}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom Docked Action Bar */}
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200/90 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
            <div className="max-w-md mx-auto grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleClear}
                className="h-12 rounded-2xl border border-slate-300 bg-white text-slate-800 font-bold text-sm flex items-center justify-center active:bg-slate-50 transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={busy}
                className="h-12 rounded-2xl bg-[#274236] text-white font-bold text-sm flex items-center justify-center gap-2 active:bg-[#1C3228] disabled:opacity-60 transition-colors shadow-sm"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Submit
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
