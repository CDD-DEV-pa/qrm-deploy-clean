import React, { useState, useEffect } from "react";

// QRM Manifest: 260 entries (syllables/words for each day)
const SEMNALE = [
  "BTC", "was", "QRM", "will", "be",
  "wit", "ness", "to", "the", "be", "gin", "nings",
  "I", "rec", "og", "nize", "the", "sig", "nal",
  "each", "day", "a", "step",
  "each", "sig", "nal", "a", "les", "son",
  "my", "val", "i", "da", "tion", "is", "the", "si", "lence",
  "that", "lis", "tens", "the", "echo", "that", "re", "sponds",
  "the", "sig", "nal", "that", "puls", "es",
  "I", "am", "part", "of", "the", "net", "work",
  "I", "will", "learn", "to", "de", "code",
  "to", "trans", "mit", "to", "leave", "trac", "es",
  "QRM", "is", "not", "just", "a", "to", "ken",
  "it", "is", "a", "path",
  "the", "sto", "ry", "does", "not", "end",
  "it", "only", "be", "gins",
  "those", "who", "per", "sist", "will", "be", "come",
  "in", "i", "ti", "ates", "build", "ers", "and", "di", "ver", "gents",
  "sig", "nal", "un", "folds", "from", "si", "lence",
  "quest", "for", "mean", "ing", "lights", "the", "dark",
  "e", "cho", "meets", "lis", "ten", "ing", "mind",
  "tra", "ce", "the", "line", "of", "pur", "pose",
  "to", "re", "veal", "the", "hidden", "truth",
  "si", "mul", "ta", "ne", "ous", "be", "gin", "nings",
  "net", "work", "woven", "by", "wit", "ness", "ed", "deeds",
  "ev", "ery", "be", "at", "is", "an", "im", "print",
  "mo", "ment", "af", "ter", "mo", "ment", "un", "fold",
  "with", "si", "lence", "be", "tween", "sound", "and", "sig", "nal",
  "val", "i", "date", "by", "si", "lence", "and", "ec", "ho",
  "lis", "ten", "to", "the", "re", "ply",
  "sto", "ry", "grows", "with", "each", "wit", "ness",
  "e", "ver", "flow", "of", "ques", "tion", "and", "res", "ponse",
  "the", "path", "lies", "a", "head",
  "cre", "ate", "with", "each", "pulse", "of", "QRM",
  "echoes", "build", "net", "works",
  "those", "who", "stand", "be", "come", "be", "yond",
  "se", "cret", "code", "car", "ried", "in", "light",
  "si", "gnal", "un", "seen", "un", "heard",
  "mo", "ment", "holds", "be", "gin", "ning",
  "trace", "leaves", "sig", "nature",
  "a", "network", "of", "in", "i", "ti", "a", "tes",
  "token", "or", "cult", "you", "de", "cide",
  "the", "quest", "nev", "er", "ends",
  "one", "signal", "one", "mind",
  "QRM", "is", "now"
];

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

const normalize = str =>
  str
    ? str
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9]/g, "")
        .toLowerCase()
    : "";

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start + ((start.getTimezoneOffset() - now.getTimezoneOffset()) * 60 * 1000);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

// Dynamic step based on the day of year (can be adjusted!)
function getSaltByDay(dayNum) {
  if (dayNum <= 60) return 20;
  if (dayNum <= 120) return 12;
  if (dayNum <= 180) return 33;
  return 47;
}

function morseVibration(morse) {
  const DOT = 100, DASH = 300, GAP = 100;
  return morse.split("").flatMap(ch => {
    if (ch === ".") return [DOT, GAP];
    if (ch === "-") return [DASH, GAP];
    if (ch === " ") return [GAP];
    return [];
  });
}

function playMorseAudio(morse) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const DOT = 0.1, DASH = 0.3, GAP = 0.1, FREQ = 650;
  let t = audioCtx.currentTime;
  for (const ch of morse) {
    if (ch === ".") {
      const o = audioCtx.createOscillator();
      o.type = "sine";
      o.frequency.value = FREQ;
      o.connect(audioCtx.destination);
      o.start(t);
      o.stop(t + DOT);
      t += DOT + GAP;
    } else if (ch === "-") {
      const o = audioCtx.createOscillator();
      o.type = "sine";
      o.frequency.value = FREQ;
      o.connect(audioCtx.destination);
      o.start(t);
      o.stop(t + DASH);
      t += DASH + GAP;
    } else if (ch === " ") {
      t += GAP;
    }
  }
  setTimeout(() => audioCtx.close(), (t - audioCtx.currentTime) * 1000 + 100);
}

function App() {
  const day = getDayOfYear() - 1;
  const year = new Date().getFullYear();
  const dayStr = String(day + 1).padStart(3, "0");

  const [semnalNo, setSemnalNo] = useState(1);

  const semnalNoStr = String(semnalNo).padStart(4, "0");
  const identificator = `${year}${dayStr}${semnalNoStr}`;
  const semnal = SEMNALE[day % SEMNALE.length];
  const morseSemnal = toMorse(semnal);

  const [input, setInput] = useState("");
  const [wallet, setWallet] = useState("");
  const [captcha, setCaptcha] = useState("");
  const [validari, setValidari] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("validariQRM") || "{}");
    } catch {
      return {};
    }
  });
  const [feedback, setFeedback] = useState("");

  const CAPTCHATEXT = "The future is?";
  const CAPTCHA_ANSWER = "qrm";

  const validKey = `wallet_${normalize(wallet)}_day_${day}_signal_${semnalNoStr}`;
  const alreadyValidated = validari[validKey] === true;

  // Step for this day
  const dayNum = day + 1;
  const SALT = getSaltByDay(dayNum);

  // Only allow validation if (semnalNo - 1) % SALT === 0
  const canValidate = (semnalNo - 1) % SALT === 0;

  useEffect(() => {
    localStorage.setItem("validariQRM", JSON.stringify(validari));
  }, [validari]);

  // NO feedback reset on input change! Patch: message stays visible after success.

  const handleVibration = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(morseVibration(morseSemnal));
    }
  };

  const handleAudio = () => {
    playMorseAudio(morseSemnal);
  };

  const handleValidate = () => {
    if (!wallet) {
      setFeedback("⚠️ Enter your wallet ID!");
      return;
    }
    if (!canValidate) {
      setFeedback(
        `⛔️ This wallet can only validate signals every ${SALT} steps per day (e.g. 1, ${1 +
          SALT}, ${1 + 2 * SALT}, ...).`
      );
      return;
    }
    if (alreadyValidated) {
      setFeedback("⛔️ This wallet has already validated this signal today!");
      return;
    }
    if (normalize(input) !== normalize(semnal)) {
      setFeedback("❌ Wrong answer for the Morse signal. Try again!");
      return;
    }
    if (normalize(captcha) !== CAPTCHA_ANSWER) {
      setFeedback("❌ Incorrect logic captcha! Answer the logic question correctly.");
      return;
    }
    setValidari({ ...validari, [validKey]: true });
    setFeedback("✅ Success! You validated this signal.");
    setInput("");
    setCaptcha("");
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", background: "#161622", color: "#fff"
    }}>
      <h1>QRM Signal Validation</h1>
      <div style={{ fontSize: 22, margin: "20px 0" }}>
        <strong>Today's signal (Day {day + 1}) – Morse:</strong>
        <div style={{
          fontSize: 34, margin: "16px 0", background: "#111", padding: "10px 40px",
          borderRadius: 12, letterSpacing: 8, border: "2px solid #333", display: "flex", alignItems: "center"
        }}>
          {morseSemnal}
          <button onClick={handleAudio}
            style={{marginLeft: 12, fontSize: 20, padding: "0 8px", background: "#282846", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer"}}
            title="Play Morse sound"
          >🔊</button>
          <button onClick={handleVibration}
            style={{marginLeft: 6, fontSize: 20, padding: "0 8px", background: "#282846", color: "#fff", border: "none", borderRadius: 7, cursor: "pointer"}}
            title="Vibrate Morse"
          >📳</button>
        </div>
        <div style={{ fontSize: 16, marginTop: 10 }}>
          <b>Signal ID:</b> {identificator}
        </div>
        <div style={{ marginTop: 10 }}>
          <label>
            <b>Signal number for the day (1–6000):</b>{" "}
            <input
              type="number"
              min={1}
              max={6000}
              value={semnalNo}
              onChange={e => setSemnalNo(Math.max(1, Math.min(6000, parseInt(e.target.value) || 1)))}
              style={{ width: 80, fontSize: 16, padding: 3, borderRadius: 5, border: "1px solid #555" }}
            />
          </label>
        </div>
        <div style={{ marginTop: 10, fontSize: 12, color: "#d1d1fa" }}>
          <b>Current rule:</b> validation every <b>{SALT}</b> signals.<br />
          (Allowed: {Array.from({length: Math.ceil(6000/SALT)}, (_,i)=>1+i*SALT).join(", ").slice(0,100)}{SALT*100 < 6000 ? "..." : ""})
        </div>
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
        placeholder={CAPTCHATEXT}
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
      <div style={{ marginTop: 18, fontWeight: "bold", minHeight: 28, fontSize: 19, color: feedback.startsWith("✅") ? "#27ea81" : feedback.startsWith("❌") ? "#ff4444" : "#fff" }}>
        {feedback}
      </div>
      <div style={{ marginTop: 32, fontSize: 12, opacity: 0.5 }}>
        <b>Rule:</b> A wallet can only validate signals every <b>{SALT}</b> signals per day.<br />
        One day = one manifest signal.<br />
        <b>Unique signal ID:</b> {identificator}<br />
        <span style={{fontSize: 10}}>You can play or vibrate the Morse code for accessibility.</span>
      </div>
    </div>
  );
}

export default App;

