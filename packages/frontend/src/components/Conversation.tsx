import { useState, useRef, useCallback, useMemo } from 'react';
import { converseWithTree } from '../api';
import { useWallet } from '../useWallet';
import { createX402Fetch } from '../x402';
import { shortAddr } from '../utils';

type ChatMessage = {
  sender: 'you' | 'tree';
  text: string;
};

type Props = {
  treeName: string;
};

export function Conversation({ treeName }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const historyRef = useRef<{ role: string; content: string }[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { address, hasWallet, connect } = useWallet();

  const x402Fetch = useMemo(() => createX402Fetch(address), [address]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;

    // Need wallet connected for x402 payment
    if (!address) {
      if (hasWallet) {
        await connect();
        return;
      }
      setMessages((prev) => [
        ...prev,
        { sender: 'tree', text: 'To speak with me, you need a wallet connected to sign the payment.' },
      ]);
      return;
    }

    setInput('');
    setMessages((prev) => [...prev, { sender: 'you', text }]);
    setSending(true);

    try {
      const response = await converseWithTree(text, historyRef.current, x402Fetch);
      historyRef.current.push({ role: 'user', content: text });
      historyRef.current.push({ role: 'assistant', content: response });
      setMessages((prev) => [...prev, { sender: 'tree', text: response }]);
    } catch (err: unknown) {
      const msg = (err as Error).message || '';
      if (msg === 'x402_payment_required') {
        setMessages((prev) => [
          ...prev,
          { sender: 'tree', text: 'This conversation requires a small USDC payment via x402. Please connect your wallet.' },
        ]);
      } else if (msg.includes('User rejected') || msg.includes('user rejected') || msg.includes('denied')) {
        setMessages((prev) => [
          ...prev,
          { sender: 'tree', text: 'Payment signature was declined. Each message requires a small USDC payment to cover my thoughts.' },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { sender: 'tree', text: `I cannot speak right now. ${msg}` },
        ]);
      }
    } finally {
      setSending(false);
      setTimeout(scrollToBottom, 50);
    }
  }

  return (
    <div className="converse-section">
      <h2 className="converse-header">Converse with the Tree</h2>
      <div className="x402-badge">
        <span className="x402-label">x402</span>
        <span className="x402-detail">$0.10 USDC per message</span>
      </div>
      <div className="chat-card">
        <div className="chat-messages">
          <div className="chat-greeting">
            I have stood here for over two hundred years. I have seen this city
            transform around me, felt the seasons pass through my rings. Ask me
            anything.
          </div>

          {!address && hasWallet && (
            <div className="chat-wallet-prompt">
              <p>Connect your wallet to converse. Each message is paid via x402.</p>
              <button className="btn-sm btn-outline" onClick={connect}>
                Connect Wallet
              </button>
            </div>
          )}

          {!hasWallet && (
            <div className="chat-wallet-prompt">
              <p>
                A browser wallet (MetaMask) with USDC is needed to converse.
                Each message is a micropayment via{' '}
                <a href="https://www.x402.org" target="_blank" rel="noopener noreferrer">x402</a>.
              </p>
            </div>
          )}

          {address && messages.length === 0 && (
            <div className="chat-wallet-prompt">
              <p>
                Connected as {shortAddr(address)}. Your wallet will sign a USDC payment for each message.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`chat-msg chat-${msg.sender}`}>
              <span className="chat-sender">
                {msg.sender === 'you' ? 'You' : treeName}
              </span>
              <p>{msg.text}</p>
            </div>
          ))}
          {sending && (
            <div className="chat-msg chat-tree">
              <span className="chat-sender">{treeName}</span>
              <p>...</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-row">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={address ? 'Ask the tree something...' : 'Connect wallet to converse...'}
            disabled={sending}
          />
          <button className="btn-sm" onClick={handleSend} disabled={sending}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
