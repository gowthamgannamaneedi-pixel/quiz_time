const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { WebSocketServer, WebSocket } = require('ws');

const PORT = 8082;
const WEB_PORT = 8081;
const HOST = '0.0.0.0';

function getActiveLanIpv4() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    const lowerName = name.toLowerCase();
    const isVirtual = lowerName.includes('vmware') || 
                      lowerName.includes('vmnet') || 
                      lowerName.includes('virtual') || 
                      lowerName.includes('vbox') || 
                      lowerName.includes('hyper-v') || 
                      lowerName.includes('docker') || 
                      lowerName.includes('wsl') || 
                      lowerName.includes('tailscale') || 
                      lowerName.includes('loopback');

    for (const iface of addrs) {
      if (iface.family === 'IPv4' && !iface.internal) {
        let priority = 5;
        if (!isVirtual && (lowerName.includes('wi-fi') || lowerName.includes('wireless') || lowerName.includes('wlan') || lowerName.includes('ethernet') || lowerName.includes('en') || lowerName.includes('eth') || lowerName.includes('local area'))) {
          priority = 10;
        } else if (isVirtual) {
          priority = 1;
        }

        candidates.push({
          name,
          address: iface.address,
          priority,
        });
      }
    }
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates.length > 0 ? candidates[0].address : '127.0.0.1';
}

// Authoritative Questions (Single Source of Truth: Exactly 10 Questions, +2 Marks each, No Negative Marks)
let DEFAULT_QUESTIONS = [
  {
    id: 'q1',
    question: 'What is the main purpose of Code in Air?',
    options: [
      { key: 'A', text: 'Improve camera quality' },
      { key: 'B', text: 'Control a computer using hand gestures' },
      { key: 'C', text: 'Train a chatbot' },
      { key: 'D', text: 'Create 3D models' },
    ],
    correctAnswer: 'B',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
  {
    id: 'q2',
    question: 'Which device provides the visual input for Code in Air?',
    options: [
      { key: 'A', text: 'Microphone' },
      { key: 'B', text: 'Keyboard' },
      { key: 'C', text: 'Webcam' },
      { key: 'D', text: 'Speaker' },
    ],
    correctAnswer: 'C',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
  {
    id: 'q3',
    question: 'What does MediaPipe primarily do in this project?',
    options: [
      { key: 'A', text: 'Play audio' },
      { key: 'B', text: 'Detect hand landmarks' },
      { key: 'C', text: 'Control the monitor' },
      { key: 'D', text: 'Store files' },
    ],
    correctAnswer: 'B',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
  {
    id: 'q4',
    question: 'How many landmarks are used to represent one hand in MediaPipe Hand Landmarker?',
    options: [
      { key: 'A', text: '10' },
      { key: 'B', text: '15' },
      { key: 'C', text: '21' },
      { key: 'D', text: '25' },
    ],
    correctAnswer: 'C',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
  {
    id: 'q5',
    question: 'What is a hand landmark?',
    options: [
      { key: 'A', text: 'A camera setting' },
      { key: 'B', text: 'A key point on the hand' },
      { key: 'C', text: 'A type of gesture' },
      { key: 'D', text: 'A screen coordinate' },
    ],
    correctAnswer: 'B',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
  {
    id: 'q6',
    question: 'Which technology is mainly responsible for webcam and image/frame processing?',
    options: [
      { key: 'A', text: 'NumPy' },
      { key: 'B', text: 'Pillow' },
      { key: 'C', text: 'OpenCV' },
      { key: 'D', text: 'MediaPipe' },
    ],
    correctAnswer: 'C',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
  {
    id: 'q7',
    question: 'Which sequence best describes the Code in Air pipeline?',
    options: [
      { key: 'A', text: 'Action → Camera → Gesture → Landmark' },
      { key: 'B', text: 'Camera → Landmarks → Gesture → Action' },
      { key: 'C', text: 'Gesture → Camera → Action → Landmark' },
      { key: 'D', text: 'Landmark → Action → Camera → Gesture' },
    ],
    correctAnswer: 'B',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
  {
    id: 'q8',
    question: 'If you wanted to add a new gesture to Code in Air, what would you need to do?',
    options: [
      { key: 'A', text: 'Replace the webcam' },
      { key: 'B', text: 'Detect the gesture and map it to an action' },
      { key: 'C', text: 'Remove MediaPipe' },
      { key: 'D', text: 'Change the monitor' },
    ],
    correctAnswer: 'B',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
  {
    id: 'q9',
    question: 'What is the biggest idea behind Code in Air?',
    options: [
      { key: 'A', text: 'Making computers faster' },
      { key: 'B', text: 'Turning visual data into meaningful interaction' },
      { key: 'C', text: 'Replacing Python' },
      { key: 'D', text: 'Improving internet speed' },
    ],
    correctAnswer: 'B',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
  {
    id: 'q10',
    question: 'Suppose your hand moves slightly while you are trying to maintain a pinch. Which mechanisms help keep the interaction stable?',
    options: [
      { key: 'A', text: 'Smoothing and hysteresis' },
      { key: 'B', text: 'Pillow and screenshots' },
      { key: 'C', text: 'ROI and saving' },
      { key: 'D', text: 'Brush size and colors' },
    ],
    correctAnswer: 'A',
    marks: 2,
    negativeMarks: 0,
    timeLimit: 20,
  },
];

// Track active participants (participantId -> Participant record)
const participantsMap = new Map();

// Track student answers per question (participantId -> { [questionId]: { selectedAnswer, answeredAt } })
const answersMap = new Map();

// Track student results (participantId -> Result object)
const resultsMap = new Map();

// Authoritative Shared Session & Quiz State (Single Source of Truth)
let activeSession = {
  sessionId: 'session-college-2026',
  quizId: 'quiz-college-2026',
  pin: '123456',
  title: 'College Quiz 2026',
  category: 'NIAT ADVANCED TECH CLUB',
  description: 'Official Code in Air & Hand Gesture Technology Championship 2026.',
  status: 'READY', // 'DRAFT' | 'READY' | 'WAITING' | 'LIVE' | 'ENDED'
  startedAt: null,
  endedAt: null,
  durationSeconds: 200, // 10 questions × 20s = 200s
  defaultQuestionTime: 20,
  questions: DEFAULT_QUESTIONS,
  connectedStudents: 0,
  participants: [],
  leaderboard: [],
};

function calculateScoreForStudent(pId, incomingAnswers) {
  const savedAnswers = answersMap.get(pId) || {};
  const currentAnswers = { ...savedAnswers, ...(incomingAnswers || {}) };

  let score = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let maxScore = 0;
  let latestAnswerTime = 0;

  const currentQuestions = activeSession.questions || DEFAULT_QUESTIONS;

  currentQuestions.forEach((q) => {
    const qMarks = typeof q.marks === 'number' ? q.marks : 2;
    maxScore += qMarks;

    const ansObj = currentAnswers[q.id];
    let choice = null;
    let answerTime = 0;

    if (ansObj && typeof ansObj === 'object') {
      choice = ansObj.selectedAnswer || null;
      answerTime = typeof ansObj.answeredAt === 'number' ? ansObj.answeredAt : 0;
    } else if (ansObj && typeof ansObj === 'string') {
      choice = ansObj;
    }

    if (answerTime > latestAnswerTime) {
      latestAnswerTime = answerTime;
    }

    const cleanChoice = choice ? String(choice).trim().toUpperCase() : null;
    const cleanCorrect = String(q.correctAnswer).trim().toUpperCase();

    if (!cleanChoice) {
      unansweredCount++;
    } else if (cleanChoice === cleanCorrect) {
      score += qMarks;
      correctCount++;
    } else {
      // NO NEGATIVE MARKING: score remains untouched for wrong answers
      wrongCount++;
    }
  });

  return {
    score,
    maxScore,
    percentage: maxScore > 0 ? Math.round((score / maxScore) * 100) : 0,
    correctCount,
    wrongCount,
    unansweredCount,
    latestAnswerTime,
    normalizedAnswers: currentAnswers,
  };
}

function parseAuthoritativeTimestamp(val) {
  if (typeof val === 'number' && !isNaN(val) && val > 0) return val;
  if (typeof val === 'string' && val.trim()) {
    const parsed = new Date(val).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 0;
}

function getLeaderboard() {
  const allResults = Array.from(resultsMap.values());
  const currentQuestions = activeSession.questions || DEFAULT_QUESTIONS;
  const standardMaxScore = currentQuestions.reduce((acc, q) => acc + (q.marks || 2), 0);

  allResults.sort((a, b) => {
    // 1. Primary: Higher score first
    const scoreA = typeof a.score === 'number' && !isNaN(a.score) ? a.score : 0;
    const scoreB = typeof b.score === 'number' && !isNaN(b.score) ? b.score : 0;
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }

    // 2. Secondary: Faster completion time first (missing/invalid defaults to 200s)
    const timeA = typeof a.timeTakenSeconds === 'number' && !isNaN(a.timeTakenSeconds) && a.timeTakenSeconds > 0 ? a.timeTakenSeconds : 200;
    const timeB = typeof b.timeTakenSeconds === 'number' && !isNaN(b.timeTakenSeconds) && b.timeTakenSeconds > 0 ? b.timeTakenSeconds : 200;
    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // 3. Final tie-breaker: Earlier authoritative submission timestamp first
    const dateA = parseAuthoritativeTimestamp(a.submittedAt);
    const dateB = parseAuthoritativeTimestamp(b.submittedAt);
    if (dateA !== dateB) {
      return dateA - dateB;
    }

    // 4. Deterministic unique ordering fallback
    return String(a.participantId || '').localeCompare(String(b.participantId || ''));
  });

  return allResults.map((item, index) => {
    const scoreVal = typeof item.score === 'number' ? item.score : 0;
    const maxScoreVal = typeof item.maxScore === 'number' && item.maxScore > 0 ? item.maxScore : standardMaxScore;
    const timeVal = typeof item.timeTakenSeconds === 'number' && item.timeTakenSeconds > 0 ? Math.round(item.timeTakenSeconds) : 200;

    return {
      rank: index + 1,
      participantId: item.participantId,
      studentName: item.studentName || 'Student',
      score: scoreVal,
      maxScore: maxScoreVal,
      percentage: typeof item.percentage === 'number' ? item.percentage : Math.round((scoreVal / maxScoreVal) * 100),
      correctCount: typeof item.correctCount === 'number' ? item.correctCount : 0,
      totalQuestions: typeof item.totalQuestions === 'number' && item.totalQuestions > 0 ? item.totalQuestions : currentQuestions.length,
      timeTakenSeconds: timeVal,
      submittedAt: item.submittedAt || new Date().toISOString(),
    };
  });
}

function getSessionPayload() {
  const currentQuestions = activeSession.questions || DEFAULT_QUESTIONS;
  const totalDurationSecs = activeSession.durationSeconds || (currentQuestions.length * 20);

  // Auto-expire zombie LIVE sessions if duration has fully elapsed
  if (activeSession.status === 'LIVE' && activeSession.startedAt) {
    if (Date.now() - activeSession.startedAt >= totalDurationSecs * 1000 + 5000) {
      activeSession.status = 'ENDED';
      activeSession.endedAt = activeSession.startedAt + totalDurationSecs * 1000;
      console.log('[SESSION AUTO-ENDED] Quiz timeline fully elapsed. Session marked as ENDED.');
    }
  }

  const participants = Array.from(participantsMap.values()).sort((a, b) => a.joinedAt - b.joinedAt);
  const leaderboard = getLeaderboard();
  const lanIp = getActiveLanIpv4();
  activeSession.participants = participants;
  activeSession.connectedStudents = participants.length;
  activeSession.leaderboard = leaderboard;
  activeSession.lanIp = lanIp;
  activeSession.joinBaseUrl = `http://${lanIp}:8081`;
  activeSession.questions = currentQuestions;
  activeSession.durationSeconds = totalDurationSecs;

  return {
    type: 'SESSION_UPDATE',
    serverTime: Date.now(),
    session: activeSession,
    lanIp: lanIp,
    joinBaseUrl: `http://${lanIp}:8081`,
    timestamp: Date.now(),
  };
}

// Create HTTP Server for REST endpoints & polling fallback
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // GET /lan-info
  if (req.url === '/lan-info' && req.method === 'GET') {
    const lanIp = getActiveLanIpv4();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      lanIp,
      webPort: '8081',
      wsPort: '8082',
      joinBaseUrl: `http://${lanIp}:8081`,
      joinUrl: `http://${lanIp}:8081/join/${activeSession.quizId}?pin=${activeSession.pin}`,
      serverTime: Date.now(),
    }));
    return;
  }

  // GET /session
  if (req.url === '/session' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getSessionPayload()));
    return;
  }

  // GET /leaderboard
  if (req.url === '/leaderboard' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      leaderboard: getLeaderboard(),
      timestamp: Date.now(),
    }));
    return;
  }

  // POST /submit-result
  if (req.url === '/submit-result' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        const { participantId, result, studentName } = data;

        if (!participantId) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Missing participantId' }));
          return;
        }

        const calculated = calculateScoreForStudent(participantId, result?.answers || {});

        const finalScore = (result && typeof result.score === 'number') ? result.score : calculated.score;
        const finalMaxScore = (result && typeof result.maxScore === 'number' && result.maxScore > 0) ? result.maxScore : calculated.maxScore;
        const finalCorrect = (result && typeof result.correctCount === 'number') ? result.correctCount : calculated.correctCount;
        const finalPercentage = (result && typeof result.percentage === 'number') ? result.percentage : calculated.percentage;
        const finalTime = (result && typeof result.timeTakenSeconds === 'number' && result.timeTakenSeconds > 0) ? result.timeTakenSeconds : 1;

        const resultRecord = {
          participantId,
          studentName: studentName || 'Student',
          score: finalScore,
          maxScore: finalMaxScore,
          percentage: finalPercentage,
          correctCount: finalCorrect,
          totalQuestions: (activeSession.questions || DEFAULT_QUESTIONS).length,
          timeTakenSeconds: finalTime,
          submittedAt: new Date().toISOString(),
          answers: calculated.normalizedAnswers,
        };

        resultsMap.set(participantId, resultRecord);

        // Update participant status to SUBMITTED
        const existingParticipant = participantsMap.get(participantId);
        if (existingParticipant) {
          existingParticipant.status = 'SUBMITTED';
          existingParticipant.submittedAt = Date.now();
          participantsMap.set(participantId, existingParticipant);
        }

        console.log(`[REST] Participant "${studentName}" (${participantId}) submitted exam: Score ${finalScore}/${finalMaxScore} in ${finalTime}s`);
        broadcastSessionUpdate();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          result: resultRecord,
          leaderboard: getLeaderboard(),
        }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // POST /admin/update-settings
  if (req.url === '/admin/update-settings' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        if (data.pin) activeSession.pin = String(data.pin).trim();
        if (data.title) activeSession.title = String(data.title).trim();
        if (data.category) activeSession.category = String(data.category).trim();
        if (data.description) activeSession.description = String(data.description).trim();
        if (data.defaultQuestionTime) activeSession.defaultQuestionTime = parseInt(data.defaultQuestionTime, 10);
        
        if (Array.isArray(data.questions) && data.questions.length > 0) {
          DEFAULT_QUESTIONS = data.questions;
          activeSession.questions = data.questions;
          activeSession.durationSeconds = data.questions.length * (activeSession.defaultQuestionTime || 20);
          console.log(`[ADMIN] Updated questions list: ${data.questions.length} questions.`);
        }

        broadcastSessionUpdate();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, session: activeSession }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      }
    });
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

// Create WebSocket Server for Realtime synchronization
const wss = new WebSocketServer({ server });

function broadcastSessionUpdate() {
  const payload = JSON.stringify(getSessionPayload());
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`[WS] Client connected from ${clientIp}`);

  // Send immediate state on connect
  ws.send(JSON.stringify(getSessionPayload()));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      const type = data.type;

      // 1. PING / TIME SYNC
      if (type === 'PING') {
        ws.send(JSON.stringify({
          type: 'PONG',
          clientTime: data.clientTime,
          serverTime: Date.now(),
        }));
        return;
      }

      // 2. STUDENT REGISTER
      if (type === 'REGISTER_STUDENT') {
        const { participantId, name } = data;
        if (participantId) {
          const cleanName = (name && String(name).trim()) || 'Student';
          const existing = participantsMap.get(participantId);
          participantsMap.set(participantId, {
            participantId,
            sessionId: activeSession.sessionId,
            quizId: activeSession.quizId,
            name: cleanName,
            status: existing?.status === 'SUBMITTED' ? 'SUBMITTED' : (activeSession.status === 'LIVE' ? 'LIVE' : 'WAITING'),
            joinedAt: existing?.joinedAt || Date.now(),
            submittedAt: existing?.submittedAt || null,
          });

          console.log(`[WS] Student Registered: "${cleanName}" (${participantId}) [Total: ${participantsMap.size}]`);
          broadcastSessionUpdate();
        }
        return;
      }

      // 3. STUDENT ANSWER SAVE
      if (type === 'STUDENT_ANSWER') {
        const { participantId, questionId, selectedAnswer, studentName } = data;
        if (participantId && questionId) {
          const currentStudentAnswers = answersMap.get(participantId) || {};
          currentStudentAnswers[questionId] = {
            selectedAnswer,
            answeredAt: Date.now(),
          };
          answersMap.set(participantId, currentStudentAnswers);

          // Update participant record status
          const p = participantsMap.get(participantId);
          if (p && p.status !== 'SUBMITTED') {
            p.status = 'LIVE';
            participantsMap.set(participantId, p);
          }

          console.log(`[WS] Student "${studentName || participantId}" answered Question ${questionId}: ${selectedAnswer}`);
        }
        return;
      }

      // 4. STUDENT EXAM SUBMIT
      if (type === 'STUDENT_SUBMIT') {
        const { participantId, result, studentName } = data;
        if (participantId) {
          const calculated = calculateScoreForStudent(participantId, result?.answers || {});

          const finalScore = (result && typeof result.score === 'number') ? result.score : calculated.score;
          const finalMaxScore = (result && typeof result.maxScore === 'number' && result.maxScore > 0) ? result.maxScore : calculated.maxScore;
          const finalCorrect = (result && typeof result.correctCount === 'number') ? result.correctCount : calculated.correctCount;
          const finalPercentage = (result && typeof result.percentage === 'number') ? result.percentage : calculated.percentage;
          const finalTime = (result && typeof result.timeTakenSeconds === 'number' && result.timeTakenSeconds > 0) ? result.timeTakenSeconds : 1;

          const resultRecord = {
            participantId,
            studentName: studentName || 'Student',
            score: finalScore,
            maxScore: finalMaxScore,
            percentage: finalPercentage,
            correctCount: finalCorrect,
            totalQuestions: (activeSession.questions || DEFAULT_QUESTIONS).length,
            timeTakenSeconds: finalTime,
            submittedAt: new Date().toISOString(),
            answers: calculated.normalizedAnswers,
          };

          resultsMap.set(participantId, resultRecord);

          // Mark participant status as SUBMITTED
          const existingParticipant = participantsMap.get(participantId);
          if (existingParticipant) {
            existingParticipant.status = 'SUBMITTED';
            existingParticipant.submittedAt = Date.now();
            participantsMap.set(participantId, existingParticipant);
          }

          console.log(`[WS] Student "${studentName}" (${participantId}) submitted exam: Score ${finalScore}/${finalMaxScore} in ${finalTime}s`);
          broadcastSessionUpdate();
        }
        return;
      }

      // 5. ADMIN CONTROL ACTIONS
      if (type === 'ADMIN_ACTION') {
        const { action, payload } = data;

        if (action === 'OPEN_WAITING_ROOM') {
          activeSession.status = 'WAITING';
          console.log('[ADMIN ACTION] Opened Waiting Room for students.');
          broadcastSessionUpdate();
          return;
        }

        if (action === 'START_LIVE_QUIZ') {
          activeSession.status = 'LIVE';
          activeSession.startedAt = Date.now();
          activeSession.endedAt = null;

          // Transition all waiting participants to LIVE
          participantsMap.forEach((p, id) => {
            if (p.status === 'WAITING') {
              p.status = 'LIVE';
              participantsMap.set(id, p);
            }
          });

          console.log(`[ADMIN ACTION] START LIVE QUIZ triggered at ${new Date(activeSession.startedAt).toISOString()} for ${participantsMap.size} students.`);
          broadcastSessionUpdate();
          return;
        }

        if (action === 'END_QUIZ') {
          activeSession.status = 'ENDED';
          activeSession.endedAt = Date.now();

          // Conclude any active participants that haven't submitted
          participantsMap.forEach((p, id) => {
            if (p.status === 'LIVE' || p.status === 'WAITING') {
              p.status = 'SUBMITTED';
              p.submittedAt = Date.now();
              participantsMap.set(id, p);

              if (!resultsMap.has(id)) {
                const autoCalc = calculateScoreForStudent(id, {});
                resultsMap.set(id, {
                  participantId: id,
                  studentName: p.name || 'Student',
                  score: autoCalc.score,
                  maxScore: autoCalc.maxScore,
                  percentage: autoCalc.percentage,
                  correctCount: autoCalc.correctCount,
                  totalQuestions: (activeSession.questions || DEFAULT_QUESTIONS).length,
                  timeTakenSeconds: activeSession.startedAt ? Math.max(1, Math.round((Date.now() - activeSession.startedAt) / 1000)) : 1,
                  submittedAt: new Date().toISOString(),
                  answers: autoCalc.normalizedAnswers,
                });
              }
            }
          });

          console.log('[ADMIN ACTION] END LIVE QUIZ triggered by Administrator.');
          broadcastSessionUpdate();
          return;
        }

        if (action === 'RESET_SESSION') {
          activeSession.status = 'READY';
          activeSession.startedAt = null;
          activeSession.endedAt = null;
          participantsMap.clear();
          answersMap.clear();
          resultsMap.clear();

          console.log('[ADMIN ACTION] Session reset to READY. Cleared all participant attempt data.');
          broadcastSessionUpdate();
          return;
        }

        if (action === 'UPDATE_SETTINGS') {
          if (payload?.pin) activeSession.pin = String(payload.pin).trim();
          if (payload?.title) activeSession.title = String(payload.title).trim();
          if (payload?.category) activeSession.category = String(payload.category).trim();
          if (payload?.description) activeSession.description = String(payload.description).trim();
          if (payload?.defaultQuestionTime) activeSession.defaultQuestionTime = parseInt(payload.defaultQuestionTime, 10);
          
          if (Array.isArray(payload?.questions) && payload.questions.length > 0) {
            DEFAULT_QUESTIONS = payload.questions;
            activeSession.questions = payload.questions;
            activeSession.durationSeconds = payload.questions.length * (activeSession.defaultQuestionTime || 20);
            console.log(`[ADMIN ACTION] Updated questions list: ${payload.questions.length} questions.`);
          }

          console.log(`[ADMIN ACTION] Quiz settings updated: PIN=${activeSession.pin}, Title="${activeSession.title}"`);
          broadcastSessionUpdate();
          return;
        }
      }
    } catch (err) {
      console.error('[WS ERROR] Failed to process message:', err);
    }
  });

  ws.on('close', () => {
    console.log(`[WS] Client disconnected from ${clientIp}`);
  });
});

// Static file server for dist/ on WEB_PORT (8081) with SPA routing
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const webServer = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const cleanPath = decodeURIComponent(parsedUrl.pathname).replace(/^\/+/, '');
  let filePath = cleanPath ? path.join(__dirname, 'dist', cleanPath) : path.join(__dirname, 'dist', 'index.html');

  fs.stat(filePath, (err, stats) => {
    if (err || stats.isDirectory()) {
      filePath = path.join(__dirname, 'dist', 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

webServer.listen(WEB_PORT, HOST, () => {
  console.log(`🌐 Static Web Server listening on: http://${HOST}:${WEB_PORT}`);
});

server.listen(PORT, HOST, () => {
  const lanIp = getActiveLanIpv4();
  console.log('====================================================');
  console.log(`🚀 NIAT REALTIME QUIZ SERVER (Single Source of Truth)`);
  console.log(`📡 Listening on: http://${HOST}:${PORT}`);
  console.log(`🌐 Local LAN IPv4: ${lanIp}`);
  console.log(`🔗 Universal Join URL: http://${lanIp}:${WEB_PORT}/join/${activeSession.quizId}?pin=${activeSession.pin}`);
  console.log(`⚡ WebSocket Server: ws://${HOST}:${PORT}`);
  console.log(`📚 Active Questions: ${DEFAULT_QUESTIONS.length} Questions (Duration: ${activeSession.durationSeconds}s)`);
  console.log('====================================================');
});
