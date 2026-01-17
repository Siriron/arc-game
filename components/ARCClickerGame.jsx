import React, { useState, useEffect } from 'react';
import { Wallet, Trophy, Zap, Star } from 'lucide-react';

const CONTRACT_ADDRESS = '0x2Ee409Ef8DB594adE165dFaaE1ADD362dbEdAb31';

const ARC_TESTNET_CONFIG = {
  chainId: '0x4cf0ea',
  chainName: 'Arc Network Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 6 },
  rpcUrls: ['https://rpc.testnet.arc.network'],
  blockExplorerUrls: ['https://testnet.arcscan.app']
};

export default function ARCClickerGame() {
  const [score, setScore] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoClickers, setAutoClickers] = useState(0);
  const [wallet, setWallet] = useState(null);
  const [onChainScore, setOnChainScore] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [particles, setParticles] = useState([]);
  const [ripples, setRipples] = useState([]);

  useEffect(() => {
    if (autoClickers > 0) {
      const interval = setInterval(() => {
        setScore(s => s + autoClickers);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoClickers]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setParticles(p => p.filter(particle => Date.now() - particle.id < 1000));
      setRipples(r => r.filter(ripple => Date.now() - ripple.id < 600));
    }, 100);
    return () => clearInterval(cleanup);
  }, []);

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const currentChainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      console.log('Current Chain ID:', currentChainId);
      console.log('Expected Chain ID:', ARC_TESTNET_CONFIG.chainId);

      if (currentChainId.toLowerCase() !== ARC_TESTNET_CONFIG.chainId.toLowerCase()) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: ARC_TESTNET_CONFIG.chainId }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [ARC_TESTNET_CONFIG],
            });
          } else {
            throw switchError;
          }
        }
      }

      setWallet(accounts[0]);
      await fetchOnChainScore(accounts[0]);
      
    } catch (err) {
      console.error('Wallet connection failed:', err);
      alert('Failed to connect wallet: ' + err.message);
    }
  };

  const fetchOnChainScore = async (address) => {
    if (!window.ethereum) return;
    
    try {
      const data = '0x5c60f693' + address.slice(2).padStart(64, '0');
      
      const result = await window.ethereum.request({
        method: 'eth_call',
        params: [{
          to: CONTRACT_ADDRESS,
          data: data
        }, 'latest']
      });

      const scoreValue = parseInt(result, 16);
      setOnChainScore(scoreValue);
    } catch (err) {
      console.error('Failed to fetch on-chain score:', err);
    }
  };

  const recordScoreOnChain = async () => {
    if (!wallet) {
      alert('Please connect your wallet first!');
      return;
    }

    if (!window.ethereum) {
      alert('Wallet not found!');
      return;
    }

    setIsRecording(true);
    try {
      const currentChainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      if (currentChainId.toLowerCase() !== ARC_TESTNET_CONFIG.chainId.toLowerCase()) {
        alert('Please switch to ARC Testnet network first!');
        setIsRecording(false);
        return;
      }

      const functionSelector = '0x6b8ff574';
      const scoreHex = score.toString(16).padStart(64, '0');
      const data = functionSelector + scoreHex;

      console.log('Sending transaction...');
      console.log('From:', wallet);
      console.log('To:', CONTRACT_ADDRESS);
      console.log('Data:', data);

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: wallet,
          to: CONTRACT_ADDRESS,
          data: data,
          gas: '0x30D40',
        }],
      });

      alert('Transaction sent! 🎉\nHash: ' + txHash);
      
      setTimeout(() => fetchOnChainScore(wallet), 5000);
      
    } catch (err) {
      console.error('Transaction failed:', err);
      alert('Transaction failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsRecording(false);
    }
  };

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setScore(s => s + clickPower);
    
    setParticles(p => [...p, { 
      id: Date.now() + Math.random(), 
      x, 
      y,
      value: clickPower 
    }]);

    setRipples(r => [...r, { id: Date.now() + Math.random(), x, y }]);
  };

  const buyUpgrade = (cost, type) => {
    if (score >= cost) {
      setScore(s => s - cost);
      if (type === 'power') setClickPower(p => p + 1);
      else setAutoClickers(a => a + 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4 overflow-hidden relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <Star 
            key={i}
            className="absolute text-yellow-200 opacity-20 animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              fontSize: `${Math.random() * 20 + 10}px`
            }}
          />
        ))}
      </div>

      <div className="max-w-md w-full relative z-10">
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-t-3xl p-6 shadow-2xl">
          <h1 className="text-4xl font-bold text-white text-center mb-4 flex items-center justify-center gap-2">
            <Zap className="text-yellow-300" />
            ARC Clicker
          </h1>
          
          {!wallet ? (
            <button
              onClick={connectWallet}
              className="w-full bg-white text-purple-700 font-bold py-3 px-6 rounded-xl hover:bg-gray-100 transition-all transform hover:scale-105 flex items-center justify-center gap-2 shadow-lg"
            >
              <Wallet size={20} />
              Connect Wallet
            </button>
          ) : (
            <div className="text-center">
              <p className="text-white text-sm mb-2">
                {wallet.slice(0, 6)}...{wallet.slice(-4)}
              </p>
              {onChainScore !== null && (
                <p className="text-yellow-300 text-xs flex items-center justify-center gap-1">
                  <Trophy size={14} />
                  On-chain: {onChainScore}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-b-3xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 animate-pulse">
              {score.toLocaleString()}
            </div>
            <p className="text-gray-600 text-sm">Total Clicks</p>
          </div>

          <div className="relative mb-8">
            <button
              onClick={handleClick}
              className="w-full aspect-square rounded-full bg-gradient-to-br from-pink-400 via-purple-500 to-indigo-600 shadow-2xl transform transition-all active:scale-95 hover:shadow-3xl hover:brightness-110 relative overflow-hidden"
              style={{ 
                boxShadow: '0 20px 60px rgba(168, 85, 247, 0.4)',
              }}
            >
              <div className="absolute inset-0 bg-white opacity-20 animate-pulse rounded-full"></div>
              <Zap className="absolute inset-0 m-auto text-white" size={80} />
              
              {particles.map(particle => (
                <div
                  key={particle.id}
                  className="absolute text-yellow-300 font-bold text-2xl animate-ping pointer-events-none"
                  style={{
                    left: particle.x,
                    top: particle.y,
                    transform: 'translate(-50%, -50%)'
                  }}
                >
                  +{particle.value}
                </div>
              ))}

              {ripples.map(ripple => (
                <div
                  key={ripple.id}
                  className="absolute border-4 border-white rounded-full pointer-events-none"
                  style={{
                    left: ripple.x,
                    top: ripple.y,
                    transform: 'translate(-50%, -50%)',
                    animation: 'ripple 0.6s ease-out'
                  }}
                />
              ))}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-700">{clickPower}</div>
              <div className="text-xs text-gray-600">Click Power</div>
            </div>
            <div className="bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-700">{autoClickers}</div>
              <div className="text-xs text-gray-600">Auto/sec</div>
            </div>
          </div>

          <div className="space-y-3 mb-6">
            <button
              onClick={() => buyUpgrade(10, 'power')}
              disabled={score < 10}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all transform hover:scale-105 shadow-lg"
            >
              +1 Click Power (Cost: 10)
            </button>
            <button
              onClick={() => buyUpgrade(50, 'auto')}
              disabled={score < 50}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all transform hover:scale-105 shadow-lg"
            >
              +1 Auto Clicker (Cost: 50)
            </button>
          </div>

          {wallet && (
            <button
              onClick={recordScoreOnChain}
              disabled={isRecording}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold py-4 px-6 rounded-xl hover:brightness-110 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
            >
              <Trophy size={20} />
              {isRecording ? 'Recording...' : 'Record Score On-Chain'}
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes ripple {
          0% {
            width: 0;
            height: 0;
            opacity: 1;
          }
          100% {
            width: 200px;
            height: 200px;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
                    }
