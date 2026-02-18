import React, { useState, useEffect, useRef } from 'react';
import questions from "./questions";

import PrivacyPolicy from './components/PrivacyPolicy';

function App() {
    // Debug: Check if questions are loaded
    console.log("=== App Component Loaded ===");
    console.log("Questions array length:", questions ? questions.length : "UNDEFINED");
    console.log("First question sample:", questions ? questions[0] : "NO DATA");

    // Game States: 'menu', 'playing', 'finished'
    const [gameState, setGameState] = useState('menu');
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [timer, setTimer] = useState(60);
    const [answersLog, setAnswersLog] = useState([]); // Track user answers for test
    const [studyAnswersLog, setStudyAnswersLog] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('class7_studyLog')) || [];
        } catch { return []; }
    });
    const [lastStudyQuestion, setLastStudyQuestion] = useState(() => {
        return Number(localStorage.getItem('class7_lastStudy')) || 0;
    });

    const [language, setLanguage] = useState(() => localStorage.getItem('class7_lang') || 'en'); // 'en' or 'ti'
    const [shuffledQuestions, setShuffledQuestions] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showConfirmLeave, setShowConfirmLeave] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showPrivacy, setShowPrivacy] = useState(false);

    const [pendingNav, setPendingNav] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const audioContextRef = useRef(null);
    const timeoutRef = useRef(null);

    // Save language to localStorage
    useEffect(() => {
        localStorage.setItem('class7_lang', language);
    }, [language]);




    // --- Translations ---
    const t = {
        en: {
            title: "Alberta Class 7",
            subtitle: "Master your knowledge with 100 practice questions. Speed and accuracy matter!",
            totalQuestions: "Total Questions",
            timePerQuestion: "Time per Question",
            passingScore: "Passing Score",
            seconds: "sec",
            startTest: "Start Test",

            question: "Question",
            time: "Time",
            practice: "Alberta Class 7 Practice",
            results: "Test Results",
            passed: "Passed",
            failed: "Failed",
            failedEarly: "Test Failed",
            passMessage: "Congratulations! You have demonstrated the knowledge required to pass the Class 7 learner's test.",
            failMessage: "You need 80% to pass. Review your mistakes below and try again!",
            failEarlyMessage: "You have accumulated 10 incorrect answers. The test has ended automatically.",
            backToMenu: "Back to Menu",
            reviewMistakes: "Review Mistakes",
            yourAnswer: "Your Answer",
            correctAnswer: "Correct Answer",
            timeout: "Timed Out",
            noAnswer: "No answer selected",
            back: "Back",
            restart: "Restart"
        },
        ti: {
            title: "አልበርታ ክፍሊ 7",
            subtitle: "ፍልጠትኩም ብ 100 ናይ ልምምድ ሕቶታት ፈትሹ። ፍጥነትን ልክዕነትን ወሳኒ እዩ!",
            totalQuestions: "ጠቅላላ ሕቶታት",
            timePerQuestion: "ግዜ ንሕቶ",
            passingScore: "መሕለፊ ነጥቢ",
            seconds: "ሰከንድ",
            startTest: "ፈተና ጀምር",

            question: "ሕቶ",
            time: "ግዜ",
            practice: "አልበርታ ክፍሊ 7 ልምምድ",
            results: "ውጽኢት ፈተና",
            passed: "ሓሊፍኩም",
            failed: "ፈሺልኩም",
            failedEarly: "ፈተና ፈሺልኩም",
            passMessage: "እንቋዕ ሓጎሰኩም! ንናይ ክፍሊ 7 ተማሃራይ መራሒ መኪና ፈተና ንምሕላፍ ዘድሊ ፍልጠት ኣርኢኩም ኣለኹም።",
            failMessage: "ንምሕላፍ 80% የድልየኩም። ጌጋታትኩም ኣብ ታሕቲ ርኣዩ እሞ እንደገና ፈትኑ!",
            failEarlyMessage: "10 ጌጋ መልሲ ሂብኩም አናለኹም። እዚ ፈተና ብርእሱ ተወዲኡ ኣሎ።",
            backToMenu: "ናብ ሜኑ ተመለስ",
            reviewMistakes: "ጌጋታትኩም ርኣዩ",
            yourAnswer: "መልስኹም",
            correctAnswer: "ትኽክል መልሲ",
            timeout: "ግዜ ተወዲኡ",
            noAnswer: "ዝተመርጸ መልሲ የለን",
            back: "ተመለስ",
            restart: "ደጊምካ ጀምር"
        }
    };

    const txt = t[language];

    // --- Audio Logic ---
    const initAudio = () => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioContextRef.current.state === 'suspended') {
            audioContextRef.current.resume();
        }
    };

    const playSound = (type) => {
        // Ensure context exists
        if (!audioContextRef.current) initAudio();

        const ctx = audioContextRef.current;
        if (!ctx) return; // Safety check

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        const now = ctx.currentTime;

        if (type === 'correct') {
            // Pleasant "Ding"
            osc.type = 'sine';
            osc.frequency.setValueAtTime(600, now);
            osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

            osc.start(now);
            osc.stop(now + 0.5);
        } else if (type === 'wrong') {
            // Dull "Buzz"
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.3);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.3, now + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc.start(now);
            osc.stop(now + 0.4);
        } else if (type === 'tick') {
            // Subtle Tick
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, now);
            gain.gain.setValueAtTime(0.05, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.start(now);
            osc.stop(now + 0.05);
        }
    };

    // --- Helper for Bilingual Text ---
    const getBilingual = (enText, tiText, lang) => {
        if (lang === 'ti') {
            if (tiText) return tiText;
            if (typeof enText === 'string' && enText.includes(' / ')) {
                return enText.split(' / ')[1] || enText;
            }
            return enText;
        } else {
            if (typeof enText === 'string' && enText.includes(' / ')) {
                return enText.split(' / ')[0];
            }
            return enText;
        }
    };

    const getBilingualOptions = (enOpts, tiOpts, lang) => {
        const baseOpts = tiOpts || enOpts;
        if (!baseOpts) return [];
        return baseOpts.map(opt => {
            if (typeof opt !== 'string') return opt;
            if (lang === 'ti') {
                if (tiOpts) return opt; // If we have tiOpts, we assume it's already Tigrinya
                if (opt.includes(' / ')) return opt.split(' / ')[1] || opt;
                return opt;
            } else {
                if (opt.includes(' / ')) return opt.split(' / ')[0];
                return opt;
            }
        });
    };

    // Reset state when question changes (synchronous to prevent timer race condition)
    React.useLayoutEffect(() => {
        if (gameState !== 'playing' || shuffledQuestions.length === 0) return;

        const question = shuffledQuestions[currentQuestion];
        if (!question) return;

        // Reset auto-advance timeout if any
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Check if already answered to preserve state on navigation
        const log = answersLog;
        const logEntry = log.find(l => l.questionId === question.id);

        if (logEntry) {
            setIsAnswered(true);
            setSelectedAnswer(logEntry.userAnswer);
            setTimer(0); // Stop timer for already answered questions
        } else {
            setIsAnswered(false);
            setSelectedAnswer(null);
            setTimer(60);
        }
    }, [currentQuestion, gameState, shuffledQuestions]);

    // Countdown timer (separate effect)
    useEffect(() => {
        if (gameState !== 'playing' || isAnswered || timer <= 0) return;

        const interval = setInterval(() => {
            setTimer((prev) => {
                if (prev <= 5 && prev > 0) playSound('tick'); // Tick last 5 seconds
                if (prev <= 1) {
                    // Timer is about to hit 0, trigger timeout
                    setTimeout(() => handleAnswerClick(null, true), 100);
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [timer, isAnswered, gameState]);


    // --- Interactions ---
    const handleStart = () => {
        try {
            setIsLoading(true);
            setError(null);
            initAudio(); // Unlock audio context on user interaction

            // Logic to prepare game
            restartQuizState();
            setGameState('playing');
        } catch (err) {
            console.error("Failed to start test:", err);
            setError(err.message || "Failed to load test questions.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudy = () => {
        try {
            setIsLoading(true);
            setError(null);
            initAudio(); // Unlock audio context

            // Sequential questions, 0-indexed correct answer
            const sequential = questions.map((q, idx) => {
                const correctAnswerIndex = q.options.findIndex(option => option === q.answer);
                return {
                    ...q,
                    id: q.numb || idx + 1,
                    correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0
                };
            });

            if (!sequential || sequential.length === 0) {
                throw new Error("No questions available for Study Mode.");
            }

            setShuffledQuestions(sequential);

            // Resume from last study question
            setCurrentQuestion(lastStudyQuestion);

            // Reset interaction states for static view
            setSelectedAnswer(null);
            setIsAnswered(true); // Treat as answered to facilitate navigation
            setTimer(0); // No timer

            setGameState('study');
        } catch (err) {
            console.error("Failed to start study mode:", err);
            setError(err.message || "Failed to load study questions.");
        } finally {
            setIsLoading(false);
        }
    };

    // Auto-save progress in Study Mode
    useEffect(() => {
        if (gameState === 'study') {
            setLastStudyQuestion(currentQuestion);

            // Log as reviewed
            const question = shuffledQuestions[currentQuestion];
            if (question) {
                setStudyAnswersLog(prev => {
                    if (!prev.some(log => log.questionId === question.id)) {
                        const newLog = [...prev, { questionId: question.id }];
                        localStorage.setItem('class7_studyLog', JSON.stringify(newLog));
                        return newLog;
                    }
                    return prev;
                });
                localStorage.setItem('class7_lastStudy', currentQuestion);
            }
        }
    }, [currentQuestion, gameState, shuffledQuestions]);


    const restartQuizState = () => {
        // Shuffle questions and calculate correctAnswer index
        const shuffled = [...questions].sort(() => Math.random() - 0.5).map((q, idx) => {
            // Find the correct answer index by matching answer text with options
            const correctAnswerIndex = q.options.findIndex(option => option === q.answer);
            return {
                ...q,
                id: q.numb || idx + 1, // Ensure each question has an ID
                correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0 // Default to 0 if not found
            };
        });
        setShuffledQuestions(shuffled);

        setCurrentQuestion(0);
        setScore(0);
        setAnswersLog([]);
        setSelectedAnswer(null);
        setIsAnswered(false);
        setTimer(60);
    };

    const handleRestart = () => {
        setGameState('menu');
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'en' ? 'ti' : 'en');
    };

    const handleAnswerClick = (optionIndex, isTimeout = false) => {
        if (isAnswered) return;

        setIsAnswered(true);
        setSelectedAnswer(optionIndex);

        const question = shuffledQuestions[currentQuestion];
        const isCorrect = !isTimeout && optionIndex === question.correctAnswer;

        // Log answer
        const newLogEntry = {
            questionId: question.id,
            questionText: question.question,
            options: question.options,
            correctAnswer: question.correctAnswer,
            userAnswer: optionIndex,
            isCorrect: isCorrect,
            isTimeout: isTimeout
        };

        setAnswersLog(prev => [...prev, newLogEntry]);

        if (isCorrect) {
            setScore(prev => prev + 1);
            playSound('correct');
            // Auto-advance after 1.5s on correct answer
            timeoutRef.current = setTimeout(() => {
                handleNext();
            }, 1500);
        } else {
            playSound('wrong');

            // Check Early Failure
            const wrongCount = answersLog.filter(l => !l.isCorrect).length + 1;
            if (wrongCount >= 10) {
                setTimeout(() => setGameState('failed_early'), 2000);
                return;
            }
            // Fallback auto-advance after 5s in Test Mode
            timeoutRef.current = setTimeout(() => {
                handleNext();
            }, 5000);
        }
    };

    const handleNext = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        // Interstitial Check for Study Mode


        setCurrentQuestion(prev => {
            const nextQuestion = prev + 1;
            if (nextQuestion < shuffledQuestions.length) {
                return nextQuestion;
            } else {
                setGameState('finished');
                return prev;
            }
        });
    };

    const handleBack = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        if (currentQuestion > 0) {
            setCurrentQuestion(prev => prev - 1);
        }
    };

    // --- Navigation Logic ---
    const navigateTo = (state) => {
        if (gameState === 'playing' && state !== 'playing') {
            setPendingNav(state);
            setShowConfirmLeave(true);
            setIsMenuOpen(false);
        } else {
            setGameState(state);
            setIsMenuOpen(false);
            if (state === 'menu') setShuffledQuestions([]); // Clear if going to menu? Or keep?
        }
    };

    const confirmLeave = () => {
        setGameState(pendingNav);
        setShowConfirmLeave(false);
        setPendingNav(null);
    };

    const cancelLeave = () => {
        setShowConfirmLeave(false);
        setPendingNav(null);
    };

    // --- Components ---
    const Navigation = () => {
        const menuItems = [
            { id: 'menu', label: language === 'en' ? 'Home' : 'መጀመሪ', icon: '🏠' },
            { id: 'playing', label: language === 'en' ? 'Start Test' : 'ፈተና ጀምር', icon: '📝', action: handleStart },
            { id: 'study', label: language === 'en' ? 'Study Mode' : 'መጽናዕቲ', icon: '📖', action: handleStudy },
            { id: 'privacy', label: language === 'en' ? 'Privacy Policy' : 'ፖሊሲ ውልቃዊነት', icon: '🔒', action: () => { setShowPrivacy(true); setIsMenuOpen(false); } },

            { id: 'help', label: language === 'en' ? 'Help' : 'ሓገዝ', icon: '❓', action: () => { setShowHelp(true); setIsMenuOpen(false); } },
        ];

        return (
            <>
                {/* Hamburger Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="fixed top-4 left-4 z-[100] p-3 bg-slate-800/80 backdrop-blur-md border border-slate-700 rounded-xl shadow-lg hover:bg-slate-700 transition-all active:scale-95"
                >
                    <div className="w-6 h-0.5 bg-white mb-1.5 rounded-full"></div>
                    <div className="w-6 h-0.5 bg-white mb-1.5 rounded-full"></div>
                    <div className="w-6 h-0.5 bg-white rounded-full"></div>
                </button>

                {/* Sidebar Drawer */}
                <div className={`fixed inset-0 z-[200] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setIsMenuOpen(false)}></div>
                    <div className={`absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-slate-900 border-r border-slate-800 shadow-2xl transition-transform duration-300 transform ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                        <div className="p-8 h-full flex flex-col">
                            <div className="flex justify-between items-center mb-10">
                                <h2 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Menu</h2>
                                <button onClick={() => setIsMenuOpen(false)} className="text-slate-400 hover:text-white text-2xl">✕</button>
                            </div>

                            <nav className="flex-1 space-y-2">
                                {menuItems.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            setIsMenuOpen(false);
                                            if (item.action) item.action();
                                            else navigateTo(item.id);
                                        }}
                                        className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all ${item.className ? item.className : (gameState === item.id ? 'bg-blue-600/20 border border-blue-500/50 text-blue-400' : 'text-slate-300 hover:bg-slate-800')}`}
                                    >
                                        <span className="text-xl">{item.icon}</span>
                                        <span className="font-bold">{item.label}</span>
                                    </button>
                                ))}

                                {gameState === 'playing' && (
                                    <button
                                        onClick={() => { navigateTo('menu'); }}
                                        className="w-full flex items-center gap-4 p-4 rounded-xl transition-all text-red-400 hover:bg-red-400/10"
                                    >
                                        <span className="text-xl">🔄</span>
                                        <span className="font-bold">{language === 'en' ? 'Restart Test' : 'ፈተና ደጊምካ ጀምር'}</span>
                                    </button>
                                )}
                            </nav>

                            <div className="pt-8 border-t border-slate-800 space-y-6">
                                <div>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-4">Language / ቋንቋ</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={() => setLanguage('en')} className={`py-2 rounded-lg border transition-all ${language === 'en' ? 'bg-blue-600 border-blue-500 font-bold' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>English</button>
                                        <button onClick={() => setLanguage('ti')} className={`py-2 rounded-lg border transition-all ${language === 'ti' ? 'bg-blue-600 border-blue-500 font-bold' : 'border-slate-700 bg-slate-800 text-slate-400'}`}>ትግርኛ</button>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-800/50 text-xs text-slate-400">
                                    <p className="font-bold text-slate-300 mb-1">Alberta Class 7 v1.1</p>
                                    <p>{language === 'en' ? 'Complete 100 questions to pass the driving test knowledge exam.' : 'ንፈተና መራሒ መኪና ንምሕላፍ 100 ሕቶታት ምልኡ።'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Confirm Leave Dialog */}
                {showConfirmLeave && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={cancelLeave}></div>
                        <div className="relative bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm w-full animate-bounce-in text-center">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">⚠️</div>
                            <h3 className="text-2xl font-bold mb-2">{language === 'en' ? 'Leave Test?' : 'ካብ ፈተና ትወጽእ ዲኻ?'}</h3>
                            <p className="text-slate-400 mb-8">{language === 'en' ? 'Switching modes will end your current test and you will lose your progress.' : 'ካብዚ ፈተና እንተወጺእካ እቲ ክሳብ ሕጂ ዝሰራሕካዮ ክጠፍእ እዩ።'}</p>
                            <div className="flex gap-4">
                                <button onClick={cancelLeave} className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-bold transition-all">{language === 'en' ? 'Cancel' : 'ስረዝ'}</button>
                                <button onClick={confirmLeave} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all shadow-lg shadow-red-900/40">{language === 'en' ? 'Leave' : 'ውጻእ'}</button>
                            </div>
                        </div>
                    </div>
                )}
                {/* Help Modal */}
                {showHelp && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md" onClick={() => setShowHelp(false)}></div>
                        <div className="relative bg-slate-900 border border-slate-700 p-6 sm:p-8 rounded-3xl shadow-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-bounce-in">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-2xl font-black text-blue-400">{language === 'en' ? 'Help & Instructions' : 'ሓገዝን መምርሕን'}</h3>
                                <button onClick={() => setShowHelp(false)} className="text-slate-500 hover:text-white text-2xl">✕</button>
                            </div>

                            <div className="space-y-6 text-slate-300">
                                <section>
                                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-blue-600 rounded-md flex items-center justify-center text-xs">📝</span>
                                        {language === 'en' ? 'Practice Test' : 'ናይ ልምምድ ፈተና'}
                                    </h4>
                                    <p className="text-sm leading-relaxed">
                                        {language === 'en'
                                            ? 'The test consists of 100 random questions. You have 60 seconds per question. You need 80% to pass. If you get 10 questions wrong, the test ends automatically.'
                                            : 'እቲ ፈተና 100 ዝተፈላለዩ ሕቶታት ዝሓዘ እዩ። ንነፍሲ ወከፍ ሕቶ 60 ሰከንድ ኣለኩም። ንምሕላፍ 80% የድልየኩም። 10 ሕቶታት እንተተጋጊኹም እቲ ፈተና ብርእሱ ክቋረጽ እዩ።'}
                                    </p>
                                </section>



                                <section>
                                    <h4 className="text-white font-bold mb-2 flex items-center gap-2">
                                        <span className="w-6 h-6 bg-orange-600 rounded-md flex items-center justify-center text-xs">🌐</span>
                                        {language === 'en' ? 'Language' : 'ቋንቋ'}
                                    </h4>
                                    <p className="text-sm leading-relaxed">
                                        {language === 'en'
                                            ? 'You can switch between English and Tigrinya at any time from the menu. Your choice will be saved.'
                                            : 'ኣብ ዝኾነ እዋን ካብቲ ሜኑ ኣብ መንጎ እንግሊዘኛን ትግርኛን ክትቅይሩ ትኽእሉ ኢኹም። ዝመረጽክምዎ ቋንቋ ድማ ተዓቂቡ ክጸንሕ እዩ።'}
                                    </p>
                                </section>
                            </div>

                            <button
                                onClick={() => setShowHelp(false)}
                                className="w-full mt-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold transition-all"
                            >
                                {language === 'en' ? 'Got it!' : 'ተረዲኡኒ!'}
                            </button>
                        </div>
                    </div>
                )}
                {showPrivacy && <PrivacyPolicy onClose={() => setShowPrivacy(false)} language={language} />}
            </>
        );
    };

    // --- Renders ---

    // --- Renders ---
    if (isLoading) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-6"></div>
                <h2 className="text-xl font-bold text-white mb-2">Loading...</h2>
                <p className="text-slate-400">Preparing questions...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-6">
                    <span className="text-4xl">⚠️</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
                <p className="text-red-400 mb-8 max-w-md">{error}</p>
                <p className="text-slate-500 text-sm mb-8 font-mono bg-slate-800 p-2 rounded">Check console for details.</p>
                <button
                    onClick={() => setGameState('menu')}
                    className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl font-bold text-white transition-all"
                >
                    Back to Menu
                </button>
            </div>
        );
    }

    if (gameState === 'menu') {
        return (
            <div className="min-h-screen bg-slate-900 text-white p-4 pt-20 flex flex-col items-center justify-center overflow-y-auto">
                <Navigation />

                {/* Removed floating relative toggle, now in Menu */}

                <div className="bg-slate-800/80 backdrop-blur-md p-6 sm:p-10 rounded-3xl shadow-2xl max-w-md w-full border border-slate-700 text-center animate-fade-in relative overflow-hidden group mb-10">

                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-emerald-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <div className="relative z-10 w-16 h-16 sm:w-20 sm:h-20 bg-blue-600 rounded-2xl mx-auto mb-6 sm:mb-8 flex items-center justify-center shadow-lg shadow-blue-500/50 transform rotate-3 group-hover:rotate-6 transition-transform">
                        <span className="text-3xl sm:text-4xl">🚗</span>
                    </div>

                    <h1 className="relative z-10 text-3xl sm:text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
                        {txt.title}
                    </h1>
                    <p className="relative z-10 text-slate-400 mb-8 text-base sm:text-lg leading-relaxed">
                        {txt.subtitle}
                    </p>

                    <div className="relative z-10 space-y-4 text-sm text-slate-400 mb-8 bg-slate-900/50 p-5 sm:p-6 rounded-xl border border-slate-700/50">
                        <div className="flex justify-between items-center">
                            <span>{txt.totalQuestions}</span>
                            <span className="font-bold text-white text-base">100</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>{txt.timePerQuestion}</span>
                            <span className="font-bold text-white text-base">60 {txt.seconds}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span>{txt.passingScore}</span>
                            <span className="font-bold text-emerald-400 text-base">80%</span>
                        </div>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <button
                            onClick={handleStart}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xl transition-all duration-200 shadow-xl shadow-blue-900/40 active:scale-95"
                        >
                            {txt.startTest}
                        </button>

                        <button
                            onClick={handleStudy}
                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-bold text-xl transition-all duration-200 shadow-xl shadow-emerald-900/40 active:scale-95 flex items-center justify-center gap-3"
                        >
                            <span>📖</span>
                            <span>{language === 'en' ? 'Study Mode' : 'መጽናዕቲ'}</span>
                        </button>

                    </div>
                </div>

                {/* Footer for extra spacing on small screens */}
                <div className="h-10 w-full shrink-0"></div>
            </div>
        );
    }

    if (gameState === 'playing' || gameState === 'study') {
        const isStudy = gameState === 'study';
        const question = shuffledQuestions[currentQuestion];

        if (!question) {
            return (
                <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Error Loading Question</h2>
                    <p className="text-slate-400 mb-4">Question index {currentQuestion} not found.</p>
                    <button
                        onClick={() => setGameState('menu')}
                        className="px-6 py-2 bg-slate-800 rounded-lg"
                    >
                        Return to Menu
                    </button>
                </div>
            );
        }



        return (
            <div key={`${gameState}-question-${currentQuestion}`} className={`min-h-screen bg-slate-900 text-white flex flex-col p-4 pt-20 font-sans selection:bg-blue-500/30 overflow-y-auto pb-24`}>
                <Navigation />
                <div className="max-w-3xl w-full mx-auto pb-10">
                    <div className="bg-slate-800/90 backdrop-blur-sm p-5 sm:p-8 rounded-2xl shadow-2xl border border-slate-700 relative overflow-hidden transition-all duration-300">

                        {/* Progress Line */}
                        <div className="absolute top-0 left-0 h-1.5 bg-slate-700 w-full">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 ease-out" style={{ width: `${((currentQuestion + 1) / shuffledQuestions.length) * 100}%` }}></div>
                        </div>

                        {/* Header */}
                        <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-8 mt-4 border-b border-slate-700/50 pb-6 shrink-0">
                            <div className="w-full">
                                <div className="flex items-center gap-3 mb-2 overflow-hidden">
                                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest shrink-0 bg-emerald-500/20 text-emerald-400 border border-emerald-500/20">
                                        {txt.practice}
                                    </span>
                                </div>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <h2 className="text-2xl font-black text-white leading-none mb-1">Q {currentQuestion + 1}</h2>
                                        <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">{txt.question} {currentQuestion + 1} OF {shuffledQuestions.length}</p>
                                    </div>

                                    {/* Timer Badge (Only for Playing/Test Mode) */}
                                    {!isStudy && (
                                        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border-2 transition-all duration-300 ${timer <= 5 ? 'border-red-500/50 bg-red-500/10 text-red-400 animate-pulse' : 'border-slate-700 bg-slate-800/50 text-blue-400'}`}>
                                            <span className="text-[10px] font-black uppercase tracking-wider opacity-60">{txt.time}</span>
                                            <span className="text-xl font-mono font-black w-6 text-center leading-none">{timer}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Question Image (if available) */}
                        {question.image && (
                            <div className="mb-6 flex justify-center">
                                <img
                                    src={question.image}
                                    alt="Road Sign"
                                    className="max-w-[260px] sm:max-w-[300px] w-full h-auto rounded-xl shadow-lg border border-slate-700/50 bg-slate-900"
                                />
                            </div>
                        )}

                        {/* Content Area */}
                        {isStudy ? (
                            /* Static Study Mode View */
                            <div className="space-y-6 animate-fade-in">
                                {/* Question Text */}
                                <div className="mb-6">
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight mb-2">
                                        {question.question.includes(' / ') ? question.question.split(' / ')[0] : question.question}
                                    </h3>
                                    {question.question.includes(' / ') && (
                                        <h3 className="text-lg sm:text-xl font-medium text-slate-300 leading-tight">
                                            {question.question.split(' / ')[1]}
                                        </h3>
                                    )}
                                </div>

                                {/* Correct Answer Box */}
                                <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
                                    <h4 className="text-emerald-400 font-black uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                        <span className="text-lg">✓</span>
                                        {language === 'en' ? 'Correct Answer' : 'ትኽክል መልሲ'}
                                    </h4>
                                    <div className="text-emerald-100 text-lg sm:text-xl font-bold leading-snug">
                                        {question.options[question.correctAnswer].includes(' / ') ? (
                                            <>
                                                <div>{question.options[question.correctAnswer].split(' / ')[0]}</div>
                                                <div className="text-emerald-400/80 text-base font-normal mt-1">{question.options[question.correctAnswer].split(' / ')[1]}</div>
                                            </>
                                        ) : (
                                            question.options[question.correctAnswer]
                                        )}
                                    </div>
                                </div>

                                {/* Explanation Box */}
                                <div className="p-5 rounded-2xl bg-blue-500/10 border border-blue-500/30">
                                    <h4 className="text-blue-400 font-black uppercase tracking-widest text-xs mb-3 flex items-center gap-2">
                                        <span className="text-lg">ℹ️</span>
                                        {language === 'en' ? 'Explanation' : 'መብርሂ'}
                                    </h4>
                                    <div className="text-slate-200 leading-relaxed text-sm sm:text-base space-y-2">
                                        {question.explanation ? (
                                            <p>{question.explanation}</p>
                                        ) : (
                                            <p className="opacity-50 italic">{language === 'en' ? 'No detailed explanation available.' : 'ዝርዝር መግለጺ የለን።'}</p>
                                        )}
                                        {question.explanation_ti && (
                                            <p className="text-slate-400">{question.explanation_ti}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Interactive Options for Test Mode */
                            <>
                                {/* Question Text (Simultaneous Bilingual) */}
                                <div className="mb-8">
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-100 leading-tight mb-2">
                                        {question.question.includes(' / ') ? question.question.split(' / ')[0] : question.question}
                                    </h3>
                                    {question.question.includes(' / ') && (
                                        <h3 className="text-lg sm:text-xl font-medium text-slate-300 leading-tight">
                                            {question.question.split(' / ')[1]}
                                        </h3>
                                    )}
                                </div>

                                {/* Options Grid (Simultaneous Bilingual) */}
                                <div className="grid gap-3 mb-6">
                                    {question.options.map((option, index) => {
                                        const isSelected = selectedAnswer === index;
                                        const isCorrect = index === question.correctAnswer;

                                        // Base State
                                        let containerClass = "border-slate-600 bg-slate-700/30 hover:bg-slate-700/60 hover:border-slate-500";
                                        let circleClass = "border-slate-500 text-slate-400";
                                        let textClassEn = "text-slate-200 font-bold";
                                        let textClassTi = "text-slate-400 text-sm";

                                        if (isAnswered) {
                                            if (isCorrect) {
                                                containerClass = "border-emerald-500 bg-emerald-500/20";
                                                circleClass = "border-emerald-400 text-emerald-400 bg-emerald-400/20";
                                                textClassEn = "text-emerald-100 font-bold";
                                                textClassTi = "text-emerald-300";
                                            } else if (isSelected) {
                                                containerClass = "border-red-500 bg-red-500/20";
                                                circleClass = "border-red-400 text-red-400 bg-red-400/20";
                                                textClassEn = "text-red-100 font-bold";
                                                textClassTi = "text-red-300";
                                            } else {
                                                containerClass = "border-slate-700 bg-slate-800/50 opacity-40";
                                            }
                                        }

                                        return (
                                            <button
                                                key={index}
                                                onClick={() => handleAnswerClick(index)}
                                                disabled={isAnswered}
                                                className={`w-full text-left p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 flex items-center group relative overflow-hidden ${containerClass} active:scale-[0.98] cursor-pointer`}
                                            >
                                                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl border-2 flex items-center justify-center mr-4 font-black text-sm sm:text-base shrink-0 transition-all duration-300 ${circleClass} shadow-inner`}>
                                                    {String.fromCharCode(65 + index)}
                                                </div>
                                                <div className="flex flex-col pr-8 transition-transform duration-300 group-hover:translate-x-1">
                                                    <span className={`text-base sm:text-lg leading-tight mb-0.5 transition-colors duration-300 ${textClassEn}`}>
                                                        {option.includes(' / ') ? option.split(' / ')[0] : option}
                                                    </span>
                                                    {option.includes(' / ') && (
                                                        <span className={`text-sm sm:text-base transition-colors duration-300 ${textClassTi}`}>
                                                            {option.split(' / ')[1]}
                                                        </span>
                                                    )}
                                                </div>

                                                {isAnswered && isCorrect && (
                                                    <div className="absolute right-4 text-emerald-400 text-2xl animate-bounce-in drop-shadow-lg">✓</div>
                                                )}
                                                {isAnswered && isSelected && !isCorrect && (
                                                    <div className="absolute right-4 text-red-300 text-2xl animate-bounce-in drop-shadow-lg">✕</div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Instant Correction / Explanation Box */}
                                {isAnswered && (
                                    <div className={`p-4 rounded-xl mb-6 animate-slide-in border-l-4 ${selectedAnswer === question.correctAnswer ? 'bg-emerald-500/10 border-emerald-500' : 'bg-red-500/10 border-red-500'}`}>
                                        {selectedAnswer !== question.correctAnswer && (
                                            <>
                                                <p className="text-red-400 font-bold mb-1">
                                                    Incorrect. Correct answer: <span className="text-emerald-400">{question.options[question.correctAnswer].split(' / ')[0]}</span>
                                                </p>
                                                <p className="text-red-500/80 font-medium text-sm mb-3">
                                                    ጌጋ። ቅኑዕ መልሲ: <span className="text-emerald-500">{question.options[question.correctAnswer].split(' / ')[1] || question.options[question.correctAnswer]}</span>
                                                </p>
                                            </>
                                        )}
                                        {selectedAnswer === question.correctAnswer && (
                                            <p className="text-emerald-400 font-bold mb-3">
                                                Correct! {language === 'ti' ? 'ልክዕ!' : ''}
                                            </p>
                                        )}

                                        {(question.explanation || question.explanation_ti) && (
                                            <div className={`border-t pt-3 mt-1 text-slate-300 text-sm leading-relaxed ${selectedAnswer === question.correctAnswer ? 'border-emerald-500/20' : 'border-red-500/20'}`}>
                                                {question.explanation && <p className="mb-2">{question.explanation}</p>}
                                                {question.explanation_ti && <p className="text-slate-400 italic">{question.explanation_ti}</p>}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}


                    </div>
                </div>

                {/* Fixed Navigation Footer */}
                <div className={`fixed left-0 w-full bg-slate-900/80 backdrop-blur-md border-t border-slate-700/50 p-4 z-40 pb-safe transition-all duration-300 bottom-0`}>
                    <div className="max-w-3xl mx-auto flex justify-between items-center gap-4">
                        <button
                            onClick={handleBack}
                            disabled={currentQuestion === 0}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold flex flex-col items-center justify-center transition-all duration-200 ${currentQuestion === 0 ? 'bg-slate-800 text-slate-600 cursor-not-allowed opacity-50' : 'bg-slate-800 text-slate-200 hover:bg-slate-700 active:scale-95 border border-slate-700'}`}
                        >
                            <span className="text-sm">Back</span>
                            <span className="text-[10px] opacity-60">ድሕሪት</span>
                        </button>



                        <button
                            onClick={handleNext}
                            disabled={!isAnswered && !isStudy}
                            className={`flex-1 py-3 px-6 rounded-xl font-bold flex flex-col items-center justify-center transition-all duration-300 ${!isAnswered && !isStudy ? 'bg-blue-600/20 text-blue-300/20 cursor-not-allowed border border-blue-600/10' : 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95 shadow-lg shadow-blue-500/40'}`}
                        >
                            <span className="text-sm">Next</span>
                            <span className="text-[10px] opacity-70">ቀጻሊ</span>
                        </button>
                    </div>
                </div>


            </div>
        );
    }

    if (gameState === 'finished' || gameState === 'failed_early') {
        const isEarlyFail = gameState === 'failed_early';
        const percentage = Math.round((score / shuffledQuestions.length) * 100);
        const passed = !isEarlyFail && percentage >= 80;
        const mistakes = answersLog.filter(log => !log.isCorrect);

        return (
            <div className="min-h-screen bg-slate-900 text-white p-4 pt-20 flex flex-col items-center overflow-y-auto">
                <Navigation />
                <div className="bg-slate-800 p-6 sm:p-10 rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-700 my-8 animate-slide-up">

                    <div className="text-center mb-12">
                        <h2 className="text-2xl sm:text-3xl font-black mb-6 text-slate-200 uppercase tracking-wider">{isEarlyFail ? txt.failedEarly : txt.results}</h2>

                        <div className={`inline-flex flex-col items-center justify-center w-40 h-40 sm:w-48 sm:h-48 rounded-full border-8 mb-8 ${passed ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : 'border-red-500 bg-red-500/10 shadow-[0_0_30px_rgba(239,68,68,0.2)]'}`}>
                            <span className={`text-5xl sm:text-6xl font-black ${passed ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isEarlyFail ? "❌" : `${percentage}%`}
                            </span>
                            {!isEarlyFail && <span className="text-xs sm:text-sm font-black uppercase tracking-widest mt-1 text-slate-500">{passed ? txt.passed : txt.failed}</span>}
                        </div>

                        <p className="text-slate-300 text-base sm:text-lg mb-10 max-w-lg mx-auto leading-relaxed">
                            {isEarlyFail ? txt.failEarlyMessage : (passed ? txt.passMessage : txt.failMessage)}
                        </p>

                        <button
                            onClick={handleRestart}
                            className="w-full sm:w-auto px-12 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-black text-lg transition-all shadow-xl shadow-blue-900/40 active:scale-95"
                        >
                            {txt.backToMenu}
                        </button>
                    </div>

                    {mistakes.length > 0 && (
                        <div className="border-t border-slate-700/50 pt-10">
                            <h3 className="text-xl sm:text-2xl font-black mb-8 text-slate-200 flex items-center">
                                <span className="bg-red-500/20 text-red-400 p-2 rounded-lg mr-3 text-xl">⚠️</span>
                                {txt.reviewMistakes} ({mistakes.length})
                            </h3>

                            <div className="space-y-4">
                                {mistakes.map((log, i) => (
                                    <div key={i} className="bg-slate-900/40 p-5 sm:p-6 rounded-2xl border border-slate-700/50 hover:border-slate-600 transition-colors">
                                        <div className="flex justify-between items-center text-slate-500 text-[10px] font-black mb-3 uppercase tracking-widest">
                                            <span>{txt.question} {log.questionId}</span>
                                            {log.isTimeout && <span className="text-red-500">{txt.timeout}</span>}
                                        </div>

                                        <p className="font-bold text-base sm:text-lg text-slate-100 mb-6 leading-tight">{log.questionText}</p>

                                        <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                                            <div className="p-4 bg-red-900/10 border border-red-900/20 rounded-xl relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-red-500/50"></div>
                                                <span className="text-[10px] uppercase text-red-500 font-black tracking-widest block mb-1">{txt.yourAnswer}</span>
                                                <div className="text-red-100 text-sm sm:text-base font-medium">
                                                    {log.isTimeout ? txt.noAnswer : log.options[log.userAnswer]}
                                                </div>
                                            </div>

                                            <div className="p-4 bg-emerald-900/10 border border-emerald-900/20 rounded-xl relative overflow-hidden group">
                                                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50"></div>
                                                <span className="text-[10px] uppercase text-emerald-500 font-black tracking-widest block mb-1">{txt.correctAnswer}</span>
                                                <div className="text-emerald-100 text-sm sm:text-base font-medium">
                                                    {log.options[log.correctAnswer]}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                <div className="h-10 w-full shrink-0"></div>
            </div>
        );
    }


    return null;
}


export default App;