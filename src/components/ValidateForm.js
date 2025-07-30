import React, { useState, useEffect } from "react";

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

export default function ValidateForm() {
  const year = new Date().getUTCFullYear();
  const [protocolDay, setProtocolDay] = useState(null);
  const [semnal, setSemnal] = useState("");
  const [loadingSemnal, setLoadingSemnal] = useState(true);
  const [decoded, setDecoded] = useState("");
  const [wallet, setWallet] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [captchaQ, setCaptchaQ] = useState("");
  const [captchaIdx, setCaptchaIdx] = useState(null);
  const [signalNo, setSignalNo] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [pauza, setPauza] = useState(false);

  // 1. Fetch ziua protocolului din backend
useEffect(() => {
console.log("API_BASE:", process.env.REACT_APP_API_BASE);
const url = `${process.env.REACT_APP_API_BASE}/api/current-protocol-day`;
  fetch(url)
    .then(res => res.json())
    .then(data => setProtocolDay(data.protocol_day))
    .catch(() => setProtocolDay("error"));
}, []);

// 2. Fetch semnalul curent (primul liber) și status pauză
useEffect(() => {
  if (!protocolDay || protocolDay === "error") return;
  setLoadingSemnal(true);
  fetch(`${process.env.REACT_APP_API_BASE}/api/semnal-zi?protocol_day=${protocolDay}`)
    .then(res => res.json())
    .then(data => {
      setSemnal(data.semnal || "");
      setSignalNo(data.signal_number || null);
      setPauza(!!data.pauza);
    })
    .catch(() => {
      setSemnal("");
      setSignalNo(null);
      setPauza(true);
    })
    .finally(() => setLoadingSemnal(false));
}, [protocolDay, feedback]);

// 3. Fetch captcha pentru signalNo
useEffect(() => {
  if (!signalNo) return;
  fetch(`${process.env.REACT_APP_API_BASE}/api/captcha-question?signal_number=${signalNo}`)
    .then(res => res.json())
    .then(data => {
      setCaptchaQ(data.question || "");
      setCaptchaIdx(data.idx); // aici setezi și idx-ul
    })
    .catch(() => {
      setCaptchaQ("Connection error!");
      setCaptchaIdx(null); // dacă e eroare, idx null
    });
}, [signalNo]);

// 4. Funcție de validare semnal
const handleValidate = () => {
  setFeedback("");
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
  if (!signalNo || pauza) {
    setFeedback("⛔ Signal not available now!");
    return;
  }

  fetch(`${process.env.REACT_APP_API_BASE}/api/validate-wallet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
  wallet: wallet.trim(),
  captcha: captcha.trim(),
  protocol_day: protocolDay,
  year,
  signal_number: signalNo,
  decoded: decoded.trim(),
  idx: captchaIdx // <-- adaugi aici
})

  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        setFeedback(`✅ You have validated signal #${signalNo}. ID: ${data.identificator}`);
        setDecoded("");
        setCaptcha("");
        // Se face refetch automat la semnal, captcha și status, din useEffect ([feedback])
      } else {
        setFeedback(`⛔ ${data.message}`);
      }
    })
    .catch(() => setFeedback("⛔ Network error or server unavailable."));
};

  // Debug/error states
  if (protocolDay === null)
    return (
      <div style={{color:'yellow', fontWeight: 'bold', padding: 20}}>
        Se încarcă ziua protocolului...<br/>
        <small>
          (Verifică dacă backendul rulează și dacă API URL e corect.<br/>
          API URL: {process.env.REACT_APP_API_URL}/api/current-protocol-day)
        </small>
      </div>
    );

  if (protocolDay === "error")
    return (
      <div style={{color:'red', fontWeight: 'bold', padding: 20}}>
        Eroare: ziua protocolului nu a putut fi încărcată din backend.<br/>
        <small>
          Verifică dacă backendul rulează și dacă API URL e corect.<br/>
          API URL: {process.env.REACT_APP_API_URL}/api/current-protocol-day
        </small>
      </div>
    );

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
        <div>Loading signal...</div>
      ) : pauza ? (
        <div style={{fontSize:22, color:'#FF0', fontWeight:700}}>
          No signal today.<br/>
          <span style={{fontSize:14}}>({feedback || "Pause day or all signals used."})</span>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 22, margin: '20px 0' }}>
            <strong>Day signal (Protocol Day {protocolDay})</strong>
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
            <div style={{fontSize:14, marginTop: 10}}>
              <b>Signal number:</b> {signalNo}
            </div>
          </div>

          <fieldset>
            <legend>Captcha</legend>
            <p><strong>Question:</strong> {captchaQ}</p>
            <input
              type="text"
              value={captcha}
              onChange={e => setCaptcha(e.target.value)}
              placeholder="Captcha answer"
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
            placeholder="Decoded word"
            style={{ marginBottom: 12, padding: 8, width: 280 }}
            required
          />

          <button
            onClick={handleValidate}
            style={{ padding: '10px 32px', background: '#711fd2', color: '#fff', border: 'none', borderRadius: 8 }}
          >
            Validate signal
          </button>

          {feedback && (
            <div style={{ marginTop: 20, padding: 10, border: '1px solid #ccc', maxWidth:420 }}>
              {feedback}
            </div>
          )}
        </>
      )}
    </div>
  );
}

