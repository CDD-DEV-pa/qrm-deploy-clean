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

// Setare ziua 1 protocol la 6 iulie 2025
function getUTCDayOfProtocol() {
  const PROTOCOL_START = Date.UTC(2025, 6, 8, 0, 0, 0); // 6 iulie 2025
  const now = Date.now();
  const diff = now - PROTOCOL_START;
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export default function ValidateForm() {
  const year = new Date().getUTCFullYear();
  const protocolDay = getUTCDayOfProtocol();
  const dayStr = String(protocolDay + 1).padStart(3, "0");
  const identificator = `${year}${dayStr}`;

  const [semnal, setSemnal] = useState("");
  const [pauza, setPauza] = useState(false);
  const [loadingSemnal, setLoadingSemnal] = useState(true);
  const [input, setInput] = useState("");
  const [wallet, setWallet] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [feedback, setFeedback] = useState("");
  const [signalNo, setSignalNo] = useState(1);
  const [captchaQ, setCaptchaQ] = useState("");
  const [validari, setValidari] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("validariQRM") || "{}");
    } catch {
      return {};
    }
  });

  // Obține semnalul manifest + pauză
  useEffect(() => {
    setLoadingSemnal(true);
    fetch(`https://backend-qrm-production.up.railway.app/api/semnal-zi?protocol_day=${protocolDay + 1}`)
      .then(res => res.json())
      .then(data => {
        setPauza(!!data.pauza);
        setSemnal(data.semnal || "");
        setLoadingSemnal(false);
      })
      .catch(() => {
        setPauza(true);
        setSemnal("");
        setLoadingSemnal(false);
      });
  }, [protocolDay]);

  // Fetch captcha question
  useEffect(() => {
    fetch(`https://backend-qrm-production.up.railway.app/api/captcha-question?signal_number=${signalNo}`)
      .then((res) => res.json())
      .then((data) => setCaptchaQ(data.question || ""))
      .catch(() => setCaptchaQ("Connection error!"));
  }, [signalNo]);

  useEffect(() => {
    localStorage.setItem("validariQRM", JSON.stringify(validari));
  }, [validari]);

  // Validare la backend
  const handleValidate = () => {
    if (!wallet.trim()) {
      setFeedback("⚠️ Enter your wallet ID!");
      return;
    }
    if (!input.trim()) {
      setFeedback("❌ Write the decoded answer!");
      return;
    }
    if (!captcha.trim()) {
      setFeedback("❌ Please answer the captcha!");
      return;
    }

    fetch('https://backend-qrm-production.up.railway.app/api/validate-wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wallet: wallet.trim(),
        captcha: captcha.trim(),
        protocol_day: protocolDay + 1,
        year,
        signal_number: signalNo,
        decoded: input.trim()
      }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setFeedback(`✅ Success! You validated signal #${signalNo} for today. ID semnal: ${data.identificator || 'N/A'}`);
          setInput("");
          setCaptcha("");
          setSignalNo(signalNo + 5);
        } else {
          setFeedback("⛔ " + (data.message || "Server error"));
        }
      })
      .catch(() => {
        setFeedback("⛔ Network error or server unavailable.");
      });
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#161622", color: "#fff"
    }}>
      <h1>QRM Signal Validation</h1>
      {loadingSemnal ? (
        <div style={{ margin: "40px", fontSize: 24 }}>Loading signal...</div>
      ) : pauza ? (
        <div style={{
          fontSize: 28, margin: "44px 0", background: "#2c233a",
          padding: "20px 44px", borderRadius: 12, border: "2px solid #644"
        }}>
          <b>Astăzi este pauză.</b><br />
          Nu se emit semnale Morse.<br />
          Revino mâine!
        </div>
      ) : (
        <>
          <div style={{ fontSize: 22, margin: "20px 0" }}>
            <strong>
              Today's signal (Protocol Day {protocolDay + 1}) – Morse:
            </strong>
            <div style={{
              fontSize: 34, margin: "16px 0", background: "#111", padding: "10px 40px",
              borderRadius: 12, letterSpacing: 8, border: "2px solid #333", display: "flex", alignItems: "center"
            }}>
              {toMorse(semnal)}
            </div>
            <div style={{ fontSize: 16, marginTop: 10 }}>
              <b>Signal ID:</b> {identificator}
            </div>
          </div>
          <div style={{ fontSize: 18, marginBottom: 14 }}>
            <b>Signal number for the day:</b> {signalNo}
            <button
              style={{
                marginLeft: 10, fontSize: 16, padding: "3px 12px",
                borderRadius: 5, border: "1px solid #888", background: "#282846", color: "#fff"
              }}
              onClick={() => setSignalNo(Math.max(1, signalNo - 5))}
            >-5</button>
            <button
              style={{
                marginLeft: 6, fontSize: 16, padding: "3px 12px",
                borderRadius: 5, border: "1px solid #888", background: "#282846", color: "#fff"
              }}
              onClick={() => setSignalNo(signalNo + 5)}
            >+5</button>
          </div>
          <div style={{ fontSize: 16, marginBottom: 10 }}>
            <b>Captcha question:</b> {captchaQ}
          </div>
          <input
            type="text"
            placeholder="Wallet ID (e.g. 6xNhZU...PcJVHQ)"
            value={wallet}
            onChange={e => setWallet(e.target.value)}
            style={{ marginBottom: 10, padding: 8, fontSize: 17, borderRadius: 6, border: "1px solid #444", width: 310 }}
            autoFocus
          />
          <input
            type="text"
            placeholder="Decoded answer (one word)"
            value={input}
            onChange={e => setInput(e.target.value)}
            style={{ marginBottom: 12, padding: 8, fontSize: 18, borderRadius: 6, border: "1px solid #444", width: 280 }}
          />
          <input
            type="text"
            placeholder="Captcha answer"
            value={captcha}
            onChange={e => setCaptcha(e.target.value)}
            style={{ marginBottom: 12, padding: 8, fontSize: 17, borderRadius: 6, border: "1px solid #444", width: 280 }}
          />
          <button
            onClick={handleValidate}
            style={{
              padding: "10px 32px", background: "#711fd2", color: "#fff",
              border: "none", borderRadius: 8, fontSize: 18, fontWeight: "bold", cursor: "pointer"
            }}
          >
            Validate signal
          </button>
        </>
      )}
      <div style={{
        marginTop: 18, fontWeight: "bold", minHeight: 28, fontSize: 19,
        color: feedback.startsWith("✅") ? "#27ea81" : feedback.startsWith("⛔") ? "#ff4444" : "#fff"
      }}>
        {feedback}
      </div>
      <div style={{ marginTop: 32, fontSize: 12, opacity: 0.5 }}>
        <b>Unique signal ID:</b> {identificator}<br />
        <span style={{ fontSize: 10 }}>
          You can play or vibrate the Morse code for accessibility.
        </span>
      </div>
    </div>
  );
}





