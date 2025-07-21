import React, { useState, useEffect } from "react";

// Morse table pentru transformare locală (opțional)
const morseTable = {
  "A": ".-", "B": "-...", "C": "-.-.", "D": "-..", "E": ".", "F": "..-.",
  "G": "--.", "H": "....", "I": "..", "J": ".---", "K": "-.-", "L": ".-..",
  "M": "--", "N": "-.", "O": "---", "P": ".--.", "Q": "--.-", "R": ".-.",
  "S": "...", "T": "-", "U": "..-", "V": "...-", "W": ".--", "X": "-..-",
  "Y": "-.--", "Z": "--..",
  "1": ".----", "2": "..---", "3": "...--", "4": "....-", "5": ".....",
  "6": "-....", "7": "--...", "8": "---..", "9": "----.", "0": "-----"
};
function toMorse(word) {
  return word
    .toUpperCase()
    .split("")
    .map(l => morseTable[l] || l)
    .join("   ");
}

// Calculează ziua de protocol relativ la start (1 august 2025)
function getUTCDayOfProtocol() {
  const PROTOCOL_START = Date.UTC(2025, 6, 21, 0, 0, 0); // 21 iulie 2025
  const now = Date.now();
  const diff = now - PROTOCOL_START;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function ValidateForm() {
  const year = new Date().getUTCFullYear();
  const protocolDay = getUTCDayOfProtocol();
  const [semnal, setSemnal] = useState("");
  const [pauza, setPauza] = useState(false);
  const [loadingSemnal, setLoadingSemnal] = useState(true);
  const [decoded, setDecoded] = useState("");
  const [wallet, setWallet] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaQ, setCaptchaQ] = useState("");
  const [signalNo, setSignalNo] = useState(protocolDay + 1);
  const [feedback, setFeedback] = useState("");

  // Fetch semnalul de zi
  useEffect(() => {
    setLoadingSemnal(true);
    fetch(`/api/semnal-zi?protocol_day=${protocolDay + 1}`)
      .then(res => res.json())
      .then(data => {
        setPauza(!!data.pauza);
        setSemnal(data.semnal || "");
      })
      .catch(() => {
        setPauza(true);
        setSemnal("");
      })
      .finally(() => setLoadingSemnal(false));
  }, [protocolDay]);

  // Fetch captcha question din backend
  useEffect(() => {
    fetch(`/api/captcha-question?signal_number=${signalNo}`)
      .then(res => res.json())
      .then(data => setCaptchaQ(data.question || ""))
      .catch(() => setCaptchaQ("Connection error!"));
  }, [signalNo]);

  // Trimite validare la backend
  const handleValidate = () => {
    if (!wallet.trim()) {
      setFeedback("⚠️ Enter your wallet ID!");
      return;
    }
    if (!decoded.trim()) {
      setFeedback("❌ Write the decoded answer!");
      return;
    }
    if (!captcha.trim()) {
      setFeedback("❌ Please answer the captcha!");
      return;
    }

    fetch('/api/validate-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: wallet.trim(),
        captcha: captcha.trim(),
        protocol_day: protocolDay + 1,
        year,
        signal_number: signalNo,
        decoded: decoded.trim()
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeedback(`✅ Success! Signal ID: ${data.identificator}`);
          setDecoded("");
          setCaptcha("");
          setSignalNo(signalNo + 5);
        } else {
          setFeedback(`⛔ ${data.message}`);
        }
      })
      .catch(() => setFeedback("⛔ Network error or server unavailable."));
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#161622',
      color: '#fff'
    }}>
      <h1>QRM Signal Validation</h1>
      {loadingSemnal ? (
        <div style={{ margin: 40, fontSize: 24 }}>Loading signal...</div>
      ) : pauza ? (
        <div style={{
          fontSize: 28,
          margin: '44px 0',
          background: '#2c233a',
          padding: '20px 44px',
          borderRadius: 12,
          border: '2px solid #644'
        }}>
          <b>Astăzi este pauză.</b><br />
          Nu se emit semnale Morse.<br />
          Revino mâine!
        </div>
      ) : (
        <>
          <div style={{ fontSize: 22, margin: '20px 0' }}>
            <strong>Today's signal (Protocol Day {protocolDay + 1}) – Morse:</strong>
            <div style={{
              fontSize: 34,
              margin: '16px 0',
              background: '#111',
              padding: '10px 40px',
              borderRadius: 12,
              letterSpacing: 8,
              border: '2px solid #333',
              display: 'flex',
              alignItems: 'center'
            }}>
              {toMorse(semnal)}
            </div>
          </div>
          <div style={{ fontSize: 18, marginBottom: 14 }}>
            <b>Signal number for the day:</b> {signalNo}
            <button
              style={{ marginLeft: 10, padding: '3px 12px', borderRadius: 6, border: '1px solid #888', background: '#282846', color: '#fff' }}
              onClick={() => setSignalNo(Math.max(1, signalNo - 5))}>-5</button>
            <button
              style={{ marginLeft: 6, padding: '3px 12px', borderRadius: 6, border: '1px solid #888', background: '#282846', color: '#fff' }}
              onClick={() => setSignalNo(signalNo + 5)}>+5</button>
          </div>
          <fieldset>
            <legend>Captcha</legend>
            <p><strong>Întrebare:</strong> {captchaQ}</p>
            <input
              type="text"
              value={captcha}
              onChange={e => setCaptcha(e.target.value)}
              placeholder="Răspuns captcha"
              style={{ marginBottom: 12, padding: 8, width: 280 }}
            />
          </fieldset>
          <input
            type="text"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            placeholder="Wallet ID"
            style={{ marginBottom: 10, padding: 8, width: 310 }}
            required
          />
          <input
            type="text"
            value={decoded}
            onChange={e => setDecoded(e.target.value)}
            placeholder="Cuvânt decodat"
            style={{ marginBottom: 12, padding: 8, width: 280 }}
            required
          />
          <button
            onClick={handleValidate}
            style={{ padding: '10px 32px', background: '#711fd2', color: '#fff', border: 'none', borderRadius: 8, fontSize: 18, fontWeight: 'bold', cursor: 'pointer' }}>
            Validate signal
          </button>
          {feedback && (
            <div style={{ marginTop: 20, padding: 10, border: '1px solid #ccc' }}>
              {feedback}
            </div>
          )}
        </>
      )}
    </div>
  );
}

