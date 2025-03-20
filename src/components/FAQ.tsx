import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ = () => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const faqItems: FAQItem[] = [
    {
      question: 'How do I buy GigCoin and utilize GigFi?',
      answer: 'Download and sign up for MetaMask, then connect your wallet.'
    },
    {
      question: 'How do I stake?',
      answer: 'Connect your wallet, choose your staking amount, and earn a guaranteed 4% APY on your funds. It\'s that simple!'
    },
    {
      question: 'Is it safe?',
      answer: 'Yes! We use industry-standard security practices and smart contracts that have been thoroughly audited.'
    },
    {
      question: 'What\'s Pick 4?',
      answer: 'Pick 4 is our daily lottery game where you can win up to 50 GigCoin by correctly guessing 4 numbers.'
    }
  ];

  return (
    <div className="bg-gray-800/50 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
      <div className="space-y-4">
        {faqItems.map((item, index) => (
          <div
            key={index}
            className="bg-gray-800/80 rounded-lg overflow-hidden"
          >
            <button
              className="w-full px-4 py-3 flex justify-between items-center text-left"
              onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
            >
              <span className={`text-white font-medium ${expandedIndex === index ? 'underline' : ''}`}>
                {item.question}
              </span>
              {expandedIndex === index ? (
                <ChevronUp className="w-5 h-5 text-white" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white" />
              )}
            </button>
            {expandedIndex === index && (
              <div className="px-4 pb-4 text-gray-300">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-8">
        <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
          Join the GigFi Hustle!
        </button>
        <div className="mt-4">
          <p className="text-sm text-gray-400 text-center">Progress to $2M</p>
          <div className="h-2 bg-gray-700 rounded-full mt-2">
            <div className="h-full w-3/4 bg-blue-500 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};