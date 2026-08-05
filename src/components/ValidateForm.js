import React, { useState, useEffect, useRef } from "react";

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
  const params = new URLSearchParams(window.location.search);
  const mode = (params.get('mode') || 'wallet').toLowerCase();
  const isAnon = mode === 'anon';
  const [protocolDay, setProtocolDay] = useState(null);
  const [semnal, setSemnal] = useState("");
  const [loadingSemnal, setLoadingSemnal] = useState(true);
  const [decoded, setDecoded] = useState("");
  const [wallet, setWallet] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaStatement, setCaptchaStatement] = useState("");
  const [captchaOptions, setCaptchaOptions] = useState([]);
  const [captchaChallengeId, setCaptchaChallengeId] = useState("");
  const [captchaRefresh, setCaptchaRefresh] = useState(0);
  const [signalNo, setSignalNo] = useState(null);
  const [protocolInfo, setProtocolInfo] = useState({});
  const [numericSignal, setNumericSignal] = useState("");
  const [morseGroups, setMorseGroups] = useState([]);
  const [activePulseIndex, setActivePulseIndex] = useState(null);
  const [revealedSymbolCount, setRevealedSymbolCount] = useState(0);
  const [waveTime, setWaveTime] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [pauza, setPauza] = useState(false);
  const playbackTimersRef = useRef([]);
  const animationFrameRef = useRef(null);

  useEffect(() => () => {
    playbackTimersRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (pauza || !morseGroups.length) return undefined;

    const animate = time => {
      setWaveTime(time);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [pauza, morseGroups.length]);

  // 1. Fetch ziua protocolului din backend
useEffect(() => {
console.log("API_BASE:", process.env.REACT_APP_API_BASE);
const url = `${process.env.REACT_APP_API_BASE}/api/current-protocol-day`;
  fetch(url)
    .then(res => res.json())
    .then(data => {
      setProtocolDay(data.protocol_day);
      setProtocolInfo(data);
    })
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
      setNumericSignal(data.numeric_signal || "");
      setMorseGroups(Array.isArray(data.morse_groups) ? data.morse_groups : []);
      setRevealedSymbolCount(0);
      setActivePulseIndex(null);
      setProtocolInfo(current => ({ ...current, ...data }));
      setPauza(!!data.pauza);
    })
    .catch(() => {
      setSemnal("");
      setSignalNo(null);
      setNumericSignal("");
      setMorseGroups([]);
      setPauza(true);
    })
    .finally(() => setLoadingSemnal(false));
}, [protocolDay, feedback]);

// 3. Fetch CAPTCHA Clandestin pentru signalNo
useEffect(() => {
  if (!signalNo) return;
  fetch(`${process.env.REACT_APP_API_BASE}/api/captcha-question?signal_number=${signalNo}`)
    .then(res => res.json())
    .then(data => {
      if (data.blocked) {
        setCaptchaStatement("Too many incorrect captcha responses. Please try again later.");
        setCaptchaOptions([]);
        setCaptchaChallengeId("");
        setCaptchaAnswer("");
        return;
      }

      setCaptchaStatement(data.statement || "");
      setCaptchaOptions(Array.isArray(data.options) ? data.options : []);
      setCaptchaChallengeId(data.challenge_id || "");
      setCaptchaAnswer("");
    })
    .catch(() => {
      setCaptchaStatement("Connection error!");
      setCaptchaOptions([]);
      setCaptchaChallengeId("");
      setCaptchaAnswer("");
    });
}, [signalNo, captchaRefresh]);

// 4. Funcție de validare semnal
const handleValidate = () => {
  setFeedback("");

  // Wallet se cere doar în modul wallet
  if (!isAnon && !wallet.trim()) {
    setFeedback("⚠️ Enter your wallet ID!");
    return;
  }
  if (!decoded.trim()) {
    setFeedback("❌ Write the decoded answer!");
    return;
  }
  if (!captchaChallengeId || !captchaAnswer) {
    setFeedback("❌ Please answer the captcha!");
    return;
  }
  if (!signalNo || pauza) {
    setFeedback("⛔ Signal not available now!");
    return;
  }

  const url = `${process.env.REACT_APP_API_BASE}${isAnon ? '/api/validate-anon' : '/api/validate-wallet'}`;
  const payload = {
    challenge_id: captchaChallengeId,
    captcha_answer: captchaAnswer,
    decoded: decoded.trim()
  };
  if (!isAnon) payload.wallet = wallet.trim();

  fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success || data.status === "ok") {
        setFeedback(
          isAnon
            ? `✅ You validated anonymously signal #${signalNo}. (no reward)`
            : `✅ You have validated signal #${signalNo}. ID: ${data.identificator}`
        );
        setDecoded("");
        setCaptchaAnswer("");
        setCaptchaRefresh(value => value + 1);
        // Se face refetch automat la semnal, captcha și status, din useEffect ([feedback])
      } else if (data.status === "already_validated_today") {
        setFeedback("⛔ You already validated anonymously today. Try again tomorrow (UTC).");
      } else {
        const remaining = data.captcha && typeof data.captcha.remaining === 'number'
          ? ` (${data.captcha.remaining} attempts left)`
          : "";
        setFeedback(`⛔ ${data.message}${remaining}`);

        if (data.captcha && (data.captcha.reason === 'incorrect' || data.captcha.reason === 'expired')) {
          setCaptchaAnswer("");
          setCaptchaRefresh(value => value + 1);
        }
      }
    })
    .catch(() => setFeedback("⛔ Network error or server unavailable."));
};

const playAudioSignal = () => {
  if (!morseGroups.length) {
    setFeedback("⛔ Audio signal is not available.");
    return;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    setFeedback("⛔ Audio is not supported in this browser.");
    return;
  }

  playbackTimersRef.current.forEach(clearTimeout);
  playbackTimersRef.current = [];
  setActivePulseIndex(null);
  setRevealedSymbolCount(0);

  const audioContext = new AudioContextClass();
  const unit = 0.095;
  let cursor = audioContext.currentTime + 0.08;
  let pulseIndex = 0;

  morseGroups.forEach((group, groupIndex) => {
    group.split("").forEach((symbol, symbolIndex) => {
      const duration = symbol === "-" ? unit * 3 : unit;
      const oscillator = audioContext.createOscillator();
      const filter = audioContext.createBiquadFilter();
      const gain = audioContext.createGain();
      const startDelay = Math.max(0, (cursor - audioContext.currentTime) * 1000);
      const endDelay = startDelay + duration * 1000;
      const currentPulse = pulseIndex;

      oscillator.frequency.value = 700;
      oscillator.type = "triangle";
      filter.type = "bandpass";
      filter.frequency.value = 700;
      filter.Q.value = 8;
      gain.gain.setValueAtTime(0.0001, cursor);
      gain.gain.exponentialRampToValueAtTime(0.32, cursor + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, cursor + duration);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start(cursor);
      oscillator.stop(cursor + duration + 0.02);

      playbackTimersRef.current.push(setTimeout(() => {
        setActivePulseIndex(currentPulse);
        setRevealedSymbolCount(count => Math.max(count, currentPulse + 1));
      }, startDelay));
      playbackTimersRef.current.push(setTimeout(() => {
        setActivePulseIndex(null);
      }, endDelay));

      cursor += duration;
      pulseIndex += 1;
      if (symbolIndex < group.length - 1) cursor += unit;
    });

    if (groupIndex < morseGroups.length - 1) cursor += unit * 3;
  });
};

const signalPulses = morseGroups.flatMap((group, groupIndex) =>
  group.split("").map((symbol, symbolIndex) => ({
    symbol,
    key: `${groupIndex}-${symbolIndex}`,
    isDash: symbol === "-",
    gapAfter: symbolIndex === group.length - 1 && groupIndex < morseGroups.length - 1
  }))
);

const numericGroups = morseGroups.map(group =>
  group.replace(/\./g, "1").replace(/-/g, "2")
);

const buildWaveformPath = () => {
  const baseline = 44;
  const start = 8;
  const end = 340;
  const step = 7;
  let path = "";
  let segmentX = start;
  const segments = [];

  signalPulses.forEach(pulse => {
    const width = pulse.isDash ? 42 : 18;
    const height = pulse.isDash ? 12 : 28;
    const startX = segmentX + 8;
    const endX = startX + width;

    segments.push({ startX, endX, y: height });
    segmentX = endX + (pulse.gapAfter ? 24 : 10);
  });

  for (let x = start; x <= end; x += step) {
    let y = baseline + Math.sin((x * 0.16) - (waveTime * 0.006)) * 1.25;
    const active = activePulseIndex === null ? null : segments[activePulseIndex];

    if (active && x >= active.startX && x <= active.endX) {
      const t = (x - active.startX) / (active.endX - active.startX);
      const lift = (baseline - active.y) * Math.sin(Math.PI * t);
      y -= lift;
    }

    path += path ? ` L ${x.toFixed(1)} ${y.toFixed(2)}` : `M ${x.toFixed(1)} ${y.toFixed(2)}`;
  }

  return path;
};

const renderNumericSignal = () => {
  let symbolIndex = 0;

  return numericGroups.map((group, groupIndex) => (
    <React.Fragment key={`group-${groupIndex}`}>
      {groupIndex > 0 && <span style={{ display: 'inline-block', width: 18 }} />}
      {group.split("").map(symbol => {
        const currentIndex = symbolIndex;
        symbolIndex += 1;

        return (
          <span
            key={`symbol-${currentIndex}`}
            style={{
              opacity: currentIndex < revealedSymbolCount ? (activePulseIndex === currentIndex ? 1 : 0.5) : 0,
              color: activePulseIndex === currentIndex ? '#facc15' : '#fff',
              textShadow: activePulseIndex === currentIndex ? '0 0 12px rgba(250, 204, 21, 0.7)' : 'none',
              transition: 'opacity 90ms ease, color 90ms ease, text-shadow 90ms ease'
            }}
          >
            {symbol}
          </span>
        );
      })}
    </React.Fragment>
  ));
};

  // Debug/error states
  if (protocolDay === null)
    return (
      <div style={{color:'yellow', fontWeight: 'bold', padding: 20}}>
        Se încarcă ziua protocolului...<br/>
        <small>
          (Verifică dacă backendul rulează și dacă API URL e corect.<br/>
          API URL: {process.env.REACT_APP_API_BASE}/api/current-protocol-day)
        </small>
      </div>
    );

  if (protocolDay === "error")
    return (
      <div style={{color:'red', fontWeight: 'bold', padding: 20}}>
        Eroare: ziua protocolului nu a putut fi încărcată din backend.<br/>
        <small>
          Verifică dacă backendul rulează și dacă API URL e corect.<br/>
          API URL: {process.env.REACT_APP_API_BASE}/api/current-protocol-day
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
            <strong>
              Protocol Year {protocolInfo.protocol_year || 1}
              {protocolInfo.active_day ? ` — Active Day ${protocolInfo.active_day}` : ` — Protocol Day ${protocolDay}`}
            </strong>
            <div style={{
              fontSize: 30,
              margin: '16px 0',
              background: '#111',
              padding: '14px 28px',
              borderRadius: 12,
              letterSpacing: 8,
              border: '2px solid #333',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 54,
              wordBreak: 'break-word'
            }}>
              {morseGroups.length ? renderNumericSignal() : (numericSignal || toMorse(semnal))}
            </div>
            <div style={{
              width: 360,
              maxWidth: '90vw',
              minHeight: 58,
              margin: '0 auto 12px',
              padding: '8px 10px',
              background: '#0b0b12',
              border: '1px solid #2f2f3a',
              borderRadius: 8,
              overflow: 'hidden'
            }}>
              <svg
                viewBox="0 0 348 56"
                preserveAspectRatio="none"
                aria-label="Morse pulse line"
                style={{ display: 'block', width: '100%', height: 56 }}
              >
                <path
                  d={buildWaveformPath()}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <button
              type="button"
              onClick={playAudioSignal}
              disabled={!morseGroups.length}
              style={{
                padding: '9px 22px',
                background: morseGroups.length ? '#2563eb' : '#333',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: morseGroups.length ? 'pointer' : 'not-allowed',
                marginBottom: 10
              }}
            >
              Play audio signal
            </button>
            <div style={{fontSize:14, marginTop: 10}}>
              <b>Signal number:</b> {signalNo}
              {protocolInfo.daily_limit ? ` / ${protocolInfo.daily_limit}` : ""}
            </div>
          </div>

          <fieldset>
            <legend>Captcha</legend>
            <p><strong>Statement:</strong> {captchaStatement}</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 12 }}>
              {captchaOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCaptchaAnswer(option)}
                  style={{
                    padding: '8px 22px',
                    background: captchaAnswer === option ? '#22c55e' : '#222',
                    color: '#fff',
                    border: captchaAnswer === option ? '2px solid #86efac' : '2px solid #555',
                    borderRadius: 8,
                    cursor: 'pointer'
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
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
