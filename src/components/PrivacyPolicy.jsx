import React from 'react';

const PrivacyPolicy = ({ onClose, language }) => {
    return (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={onClose}></div>
            <div className="relative bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-bounce-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-black text-blue-400">Privacy Policy</h3>
                    <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl">✕</button>
                </div>

                <div className="space-y-4 text-slate-300 text-sm leading-relaxed">
                    <p><strong>Last updated: January 2, 2026</strong></p>
                    <p>This app uses AdMob to display ads. By using this app, you consent to the collection of data used for advertising.</p>

                    <h4 className="text-white font-bold mt-4">1. Data Collection</h4>
                    <p>We use Google AdMob to show ads. AdMob may collect and use your device's advertising ID and other data to serve personalized ads.</p>

                    <h4 className="text-white font-bold mt-4">2. Third-Party Services</h4>
                    <p>This app utilizes the following third-party services which may collect information used to identify you:</p>
                    <ul className="list-disc pl-5">
                        <li>Google AdMob</li>
                        <li>Google Play Services</li>
                    </ul>

                    <h4 className="text-white font-bold mt-4">3. Opt-Out</h4>
                    <p>You can opt-out of personalized advertising by visiting your device's Google Settings &gt; Ads.</p>

                    <h4 className="text-white font-bold mt-4">4. Contact</h4>
                    <p>If you have any questions, please contact us at support@example.com.</p>
                </div>

                <button
                    onClick={onClose}
                    className="w-full mt-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold transition-all"
                >
                    Close
                </button>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
