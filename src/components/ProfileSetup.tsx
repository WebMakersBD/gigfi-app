import React, { useState, useRef } from 'react';
import { Camera, X, Upload, Check } from 'lucide-react';
import { useWalletStore } from '../lib/store';

interface ProfileSetupProps {
  onClose: () => void;
}

export const ProfileSetup: React.FC<ProfileSetupProps> = ({ onClose }) => {
  const { username, setUsername } = useWalletStore();
  const [newUsername, setNewUsername] = useState(username || '');
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<'username' | 'avatar' | 'bio'>('username');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (newUsername) {
      setUsername(newUsername.startsWith('@') ? newUsername : `@${newUsername}`);
    }
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'username':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Choose your username</h3>
            <p className="text-gray-400">This is how others will see you on GigFi</p>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="@username"
            />
            <button
              onClick={() => setStep('avatar')}
              disabled={!newUsername}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              Continue
            </button>
          </div>
        );

      case 'avatar':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Choose a profile picture</h3>
            <p className="text-gray-400">Add a profile picture to personalize your account</p>
            
            <div className="flex justify-center">
              <div className="relative">
                {avatarPreview ? (
                  <div className="relative">
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-32 h-32 rounded-full object-cover"
                    />
                    <button
                      onClick={() => {
                        setAvatarPreview('');
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center cursor-pointer hover:bg-gray-600 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setStep('bio')}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                {avatarPreview ? 'Continue' : 'Skip for now'}
              </button>
            </div>
          </div>
        );

      case 'bio':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Add a bio</h3>
            <p className="text-gray-400">Tell others about yourself</p>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg border border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Write a brief bio..."
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                Complete Setup
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
            <div className="w-2 h-2 rounded-full bg-gray-600"></div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {renderStep()}
      </div>
    </div>
  );
};