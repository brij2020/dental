import React, { useState, useEffect } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: () => void;
}

const OtpModal: React.FC<OtpModalProps> = ({ isOpen, onClose, onVerified }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [verified, setVerified] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setOtp('');
      setError('');
      setVerified(false);
    }
  }, [isOpen]);

  const handleVerify = () => {
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP.');
      return;
    }
    if (!recaptchaValue) {
      setError('Please complete the reCAPTCHA!');
      return;
    }
    setError('');
    setVerified(true);
    onVerified();
    onClose();
  };

  const handleResend = () => {
    setOtp('');
    setError('OTP resent! (Simulated)');
  };

  if (!isOpen) return null;

  return (


      <div className=" bg-white rounded-sm p-4 flex-1">
        <h3 className="font-semibold text-lg text-center">OTP Verification</h3>
        <div className="mb-4 mt-6">
          <label className="block text-cyan-800 text-sm mb-1">Enter 6-digit OTP</label>
          <input
            type="text"
            maxLength={6}
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full p-2 border rounded-sm bg-gray-50 text-sm outline-none border-gray-300"
            autoFocus
          />
        </div>
        <div className='mt-5'>

          <ReCAPTCHA
            // sitekey="6LceNYMrAAAAAK833PKCBZkh26VRyu9QAefeCENc"
            sitekey="6LeMiIwrAAAAALXh2bBeRXNB5ygfVaIfA9N_MAOa"
            onChange={(value: string | null) => setRecaptchaValue(value)}
            className="my-0 flex justify-center"
          />
        </div>
        {error && <div className="text-red-600 mb-2 text-sm text-center">{error}</div>}
        <div className="flex justify-between items-end mt-6">
          <button
            onClick={handleResend}
            type="button"
            className="text-cyan-800 hover:underline text-sm "
          >
            Resend OTP
          </button>
          <button
            onClick={handleVerify}
            type="button"
            className="bg-cyan-800 text-white hover:bg-cyan-700 py-2 px-8 font-medium text-sm rounded-sm"
          >
            Verify
          </button>
        </div>
      </div>
    
  );

};

export default OtpModal; 