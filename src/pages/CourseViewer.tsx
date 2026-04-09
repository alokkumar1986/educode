import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { getLessons, getUserProgress, updateLessonProgress } from '../lib/firebase-utils';
import { Course, Lesson, UserProgress } from '../types';
import { Button, buttonVariants } from '../components/ui/button';
import { cn } from '../lib/utils';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Menu, 
  PlayCircle, 
  CheckCircle2, 
  BookOpen,
  Loader2,
  Home,
  Share2,
  HelpCircle,
  X,
  Circle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

export default function CourseViewer() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    if (!courseId) return;

    const fetchCourse = async () => {
      try {
        const docRef = doc(db, 'courses', courseId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() } as Course);
        }
      } catch (error) {
        console.error("Error fetching course", error);
      }
    };

    fetchCourse();
    const unsubscribe = getLessons(courseId, (data) => {
      setLessons(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [courseId]);

  useEffect(() => {
    if (auth.currentUser && courseId) {
      getUserProgress(auth.currentUser.uid, courseId).then(setProgress);
    }
  }, [courseId, currentLessonIndex]);

  const currentLesson = lessons[currentLessonIndex];

  const handleNext = async () => {
    if (currentLessonIndex < lessons.length - 1) {
      // Mark current lesson as completed if it's not already
      if (auth.currentUser && courseId && currentLesson) {
        await updateLessonProgress(auth.currentUser.uid, courseId, currentLesson.id);
        toast.success("Lesson completed!");
      }
      setCurrentLessonIndex(currentLessonIndex + 1);
      setQuizAnswers({});
      setQuizSubmitted(false);
      window.scrollTo(0, 0);
    }
  };

  const handlePrev = () => {
    if (currentLessonIndex > 0) {
      setCurrentLessonIndex(currentLessonIndex - 1);
      setQuizAnswers({});
      setQuizSubmitted(false);
      window.scrollTo(0, 0);
    }
  };

  const handleQuizSubmit = () => {
    if (!currentLesson?.quiz) return;
    setQuizSubmitted(true);
    const correctCount = currentLesson.quiz.questions.filter(
      (q, idx) => quizAnswers[q.id] === q.correctAnswerIndex
    ).length;
    
    if (correctCount === currentLesson.quiz.questions.length) {
      toast.success("Perfect score! You've mastered this lesson.");
    } else {
      toast.info(`You got ${correctCount}/${currentLesson.quiz.questions.length} correct.`);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return (
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Course not found</h2>
          <Link to="/explore" className={cn(buttonVariants())}>Back to Explore</Link>
        </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r bg-muted/20 flex flex-col shrink-0"
          >
            <div className="p-4 border-b bg-background">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline">{course.category}</Badge>
                <Button variant="ghost" size="icon" onClick={() => setIsSidebarOpen(false)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </div>
              <h2 className="font-bold line-clamp-2">{course.title}</h2>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-2">
                {lessons.map((lesson, index) => {
                  const isCompleted = progress?.completedLessons.includes(lesson.id);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => {
                        setCurrentLessonIndex(index);
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors mb-1 ${
                        currentLessonIndex === index 
                          ? 'bg-primary text-primary-foreground' 
                          : 'hover:bg-muted'
                      }`}
                    >
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs border ${
                        currentLessonIndex === index ? 'border-primary-foreground/30' : 'border-muted-foreground/30'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                      </div>
                      <span className="text-sm font-medium line-clamp-1">{lesson.title}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-4 border-t bg-background">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-medium">Your Progress</span>
                <span className="text-muted-foreground">
                  {Math.round(((progress?.completedLessons.length || 0) / lessons.length) * 100)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${((progress?.completedLessons.length || 0) / lessons.length) * 100}%` }}
                  className="bg-primary h-full"
                />
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {!isSidebarOpen && (
          <Button 
            variant="outline" 
            size="icon" 
            className="absolute top-4 left-4 z-10 rounded-full shadow-md"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
        )}

        <header className="border-b bg-background px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-bold hidden md:block">
              {currentLesson?.title || "Welcome to the Course"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="gap-2">
              <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Share</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <div className="flex items-center gap-1">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentLessonIndex === 0}
                onClick={handlePrev}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-xs font-medium px-2">
                {currentLessonIndex + 1} / {lessons.length}
              </span>
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentLessonIndex === lessons.length - 1}
                onClick={handleNext}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <ScrollArea className="flex-1">
          <div className="max-w-4xl mx-auto px-8 py-12">
            {currentLesson ? (
              <motion.div
                key={currentLesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="prose prose-slate dark:prose-invert max-w-none"
              >
                <h1 className="text-3xl font-bold mb-8">{currentLesson.title}</h1>
                <div className="markdown-body">
                  <ReactMarkdown
                    components={{
                      code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                          <div className="my-6 rounded-lg overflow-hidden border">
                            <SyntaxHighlighter
                              style={vscDarkPlus}
                              language={match[1]}
                              PreTag="div"
                              {...props}
                            >
                              {String(children).replace(/\n$/, '')}
                            </SyntaxHighlighter>
                          </div>
                        ) : (
                          <code className="bg-muted px-1.5 py-0.5 rounded text-primary font-mono text-sm" {...props}>
                            {children}
                          </code>
                        );
                      },
                      h2: ({ children }) => <h2 className="text-2xl font-bold mt-12 mb-4 pb-2 border-b">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-xl font-bold mt-8 mb-3">{children}</h3>,
                      p: ({ children }) => <p className="leading-relaxed mb-6 text-muted-foreground">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-muted-foreground">{children}</ul>,
                      ol: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-muted-foreground">{children}</ol>,
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 italic my-6 text-muted-foreground bg-muted/30 py-2 rounded-r">
                          {children}
                        </blockquote>
                      ),
                    }}
                  >
                    {currentLesson.content}
                  </ReactMarkdown>
                </div>

                {/* Quiz Section */}
                {currentLesson.quiz && currentLesson.quiz.questions.length > 0 && (
                  <div className="mt-16 p-8 bg-muted/50 rounded-2xl border">
                    <div className="flex items-center gap-2 mb-6">
                      <HelpCircle className="w-6 h-6 text-primary" />
                      <h2 className="text-2xl font-bold">Knowledge Check</h2>
                    </div>
                    
                    <div className="space-y-8">
                      {currentLesson.quiz.questions.map((q, qIdx) => (
                        <div key={q.id} className="space-y-4">
                          <p className="font-medium text-lg">{qIdx + 1}. {q.question}</p>
                          <div className="grid grid-cols-1 gap-3">
                            {q.options.map((option, oIdx) => {
                              const isSelected = quizAnswers[q.id] === oIdx;
                              const isCorrect = oIdx === q.correctAnswerIndex;
                              const showResult = quizSubmitted;
                              
                              return (
                                <button
                                  key={oIdx}
                                  disabled={quizSubmitted}
                                  onClick={() => setQuizAnswers(prev => ({ ...prev, [q.id]: oIdx }))}
                                  className={cn(
                                    "p-4 rounded-xl border text-left transition-all",
                                    !showResult && isSelected && "border-primary bg-primary/5 ring-1 ring-primary",
                                    !showResult && !isSelected && "hover:border-primary/50 hover:bg-muted",
                                    showResult && isCorrect && "border-green-500 bg-green-500/10 ring-1 ring-green-500",
                                    showResult && isSelected && !isCorrect && "border-destructive bg-destructive/10 ring-1 ring-destructive",
                                    showResult && !isCorrect && !isSelected && "opacity-50"
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>{option}</span>
                                    {showResult && isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                    {showResult && isSelected && !isCorrect && <X className="w-4 h-4 text-destructive" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {!quizSubmitted ? (
                      <Button 
                        className="mt-8 w-full md:w-auto" 
                        onClick={handleQuizSubmit}
                        disabled={Object.keys(quizAnswers).length < currentLesson.quiz.questions.length}
                      >
                        Submit Quiz
                      </Button>
                    ) : (
                      <div className="mt-8 p-4 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between">
                        <p className="text-sm font-medium">Quiz submitted! You can now proceed to the next lesson.</p>
                        <Button variant="ghost" size="sm" onClick={() => { setQuizSubmitted(false); setQuizAnswers({}); }}>
                          Retry Quiz
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-20 pt-8 border-t flex items-center justify-between">
                  <Button 
                    variant="outline" 
                    disabled={currentLessonIndex === 0}
                    onClick={handlePrev}
                    className="gap-2"
                  >
                    <ChevronLeft className="w-4 h-4" /> Previous Lesson
                  </Button>
                  {currentLessonIndex === lessons.length - 1 ? (
                    <Button 
                      className="gap-2 bg-green-600 hover:bg-green-700"
                      onClick={async () => {
                        if (auth.currentUser && courseId && currentLesson) {
                          await updateLessonProgress(auth.currentUser.uid, courseId, currentLesson.id);
                          toast.success("Course completed! Congratulations!");
                          navigate('/dashboard');
                        }
                      }}
                      disabled={currentLesson.quiz && !quizSubmitted}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Finish Course
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleNext}
                      className="gap-2"
                      disabled={currentLesson.quiz && !quizSubmitted}
                    >
                      Next Lesson <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20">
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-20" />
                <h2 className="text-2xl font-bold mb-2">Welcome to {course.title}</h2>
                <p className="text-muted-foreground mb-8">Select a lesson from the sidebar to start learning.</p>
                {lessons.length > 0 && (
                  <Button onClick={() => setCurrentLessonIndex(0)}>Start First Lesson</Button>
                )}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
