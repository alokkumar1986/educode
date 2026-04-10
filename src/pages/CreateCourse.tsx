import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { createCourse, updateCourse, addLesson, getLessons, updateLesson, deleteLesson } from '../lib/firebase-utils';
import { Course, Lesson, CATEGORIES, Category, Quiz, QuizQuestion, UserProfile } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Separator } from '../components/ui/separator';
import CodePlayground from '../components/CodePlayground';
import { 
  PlusCircle, 
  Save, 
  ArrowLeft, 
  BookOpen, 
  Layout, 
  FileText, 
  Loader2, 
  Eye,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Edit,
  HelpCircle,
  Code2,
  Check
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface CreateCourseProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function CreateCourse({ user, profile }: CreateCourseProps) {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(courseId ? true : false);
  const [saving, setSaving] = useState(false);
  
  // Course State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('HTML');
  const [thumbnail, setThumbnail] = useState('');

  // Lessons State
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [newLessonTitle, setNewLessonTitle] = useState('');
  const [newLessonContent, setNewLessonContent] = useState('');
  const [newLessonQuiz, setNewLessonQuiz] = useState<Quiz>({ questions: [] });
  const [previewMode, setPreviewMode] = useState(false);
  const [showPlayground, setShowPlayground] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    if (profile && profile.role === 'student') {
      toast.error("Access denied. Only instructors can create courses.");
      navigate('/dashboard');
      return;
    }

    if (courseId) {
      const fetchCourse = async () => {
        try {
          const docRef = doc(db, 'courses', courseId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Course;
            setTitle(data.title);
            setDescription(data.description);
            setCategory(data.category as Category);
            setThumbnail(data.thumbnail || '');
          }
          
          getLessons(courseId, (data) => {
            setLessons(data);
            setLoading(false);
          });
        } catch (error) {
          console.error("Error fetching course", error);
          toast.error("Failed to load course details");
          setLoading(false);
        }
      };
      fetchCourse();
    }
  }, [courseId, user, navigate]);

  const handleSaveCourse = async () => {
    if (!title || !description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSaving(true);
    try {
      const courseData: Partial<Course> = {
        title,
        description,
        category,
        thumbnail,
        instructorId: user?.uid,
        instructorName: user?.displayName || 'Anonymous',
        instructorPhoto: user?.photoURL || '',
      };

      if (courseId) {
        await updateCourse(courseId, courseData);
        toast.success("Course details updated!");
      } else {
        const id = await createCourse(courseData);
        toast.success("Course created! Now add some lessons.");
        navigate(`/edit/${id}`);
      }
    } catch (error) {
      toast.error("Failed to save course");
    } finally {
      setSaving(false);
    }
  };

  const handleAddLesson = async () => {
    if (!newLessonTitle || !newLessonContent || !courseId) {
      toast.error("Please fill in lesson title and content");
      return;
    }

    setSaving(true);
    try {
      const lessonData: any = {
        title: newLessonTitle,
        content: newLessonContent,
        order: editingLessonId ? lessons.find(l => l.id === editingLessonId)?.order : lessons.length + 1,
      };

      if (newLessonQuiz.questions.length > 0) {
        lessonData.quiz = newLessonQuiz;
      }

      if (editingLessonId) {
        await updateLesson(courseId, editingLessonId, lessonData);
        toast.success("Lesson updated!");
      } else {
        await addLesson(courseId, lessonData);
        toast.success("Lesson added!");
      }

      setNewLessonTitle('');
      setNewLessonContent('');
      setNewLessonQuiz({ questions: [] });
      setIsAddingLesson(false);
      setEditingLessonId(null);
    } catch (error: any) {
      console.error("Error saving lesson:", error);
      const errorMsg = error.message ? error.message : "Failed to save lesson";
      toast.error(`Failed to save lesson: ${errorMsg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id);
    setNewLessonTitle(lesson.title);
    setNewLessonContent(lesson.content);
    setNewLessonQuiz(lesson.quiz || { questions: [] });
    setIsAddingLesson(true);
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!courseId) return;
    if (!window.confirm("Are you sure you want to delete this lesson?")) return;

    try {
      await deleteLesson(courseId, lessonId);
      toast.success("Lesson deleted");
    } catch (error) {
      toast.error("Failed to delete lesson");
    }
  };

  const addQuizQuestion = () => {
    const newQuestion: QuizQuestion = {
      id: Math.random().toString(36).substr(2, 9),
      question: '',
      options: ['', '', '', ''],
      correctAnswerIndex: 0
    };
    setNewLessonQuiz(prev => ({
      questions: [...prev.questions, newQuestion]
    }));
  };

  const updateQuizQuestion = (qIdx: number, field: string, value: any) => {
    setNewLessonQuiz(prev => {
      const newQuestions = [...prev.questions];
      if (field === 'question') newQuestions[qIdx].question = value;
      if (field === 'correctAnswerIndex') newQuestions[qIdx].correctAnswerIndex = value;
      return { questions: newQuestions };
    });
  };

  const updateQuizOption = (qIdx: number, oIdx: number, value: string) => {
    setNewLessonQuiz(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIdx].options[oIdx] = value;
      return { questions: newQuestions };
    });
  };

  const removeQuizQuestion = (qIdx: number) => {
    setNewLessonQuiz(prev => ({
      questions: prev.questions.filter((_, i) => i !== qIdx)
    }));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-3xl font-bold">
          {courseId ? 'Edit Course' : 'Create New Course'}
        </h1>
      </div>

      <Tabs defaultValue="details" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="details" className="gap-2">
            <Layout className="w-4 h-4" /> Course Details
          </TabsTrigger>
          <TabsTrigger value="content" disabled={!courseId} className="gap-2">
            <FileText className="w-4 h-4" /> Lessons & Content
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>This information will be visible to all students.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Title *</label>
                <Input 
                  placeholder="e.g. Master React in 30 Days" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description *</label>
                <Textarea 
                  placeholder="What will students learn in this course?" 
                  className="min-h-[120px]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Category</label>
                  <select 
                    className="w-full p-2 border rounded bg-background"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Thumbnail URL (Optional)</label>
                  <Input 
                    placeholder="https://example.com/image.jpg" 
                    value={thumbnail}
                    onChange={(e) => setThumbnail(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6 flex justify-between">
              <p className="text-xs text-muted-foreground">* Required fields</p>
              <Button onClick={handleSaveCourse} disabled={saving} className="gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {courseId ? 'Update Course' : 'Create Course'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lesson List */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <BookOpen className="w-4 h-4" /> Lessons ({lessons.length})
                </h3>
                <Button size="sm" onClick={() => setIsAddingLesson(true)} disabled={isAddingLesson}>
                  <Plus className="w-4 h-4 mr-1" /> Add Lesson
                </Button>
              </div>
              
              <div className="space-y-2">
                {lessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center gap-2 p-3 border rounded-lg bg-card group">
                    <span className="text-xs font-mono text-muted-foreground w-4">{index + 1}</span>
                    <span className="text-sm font-medium flex-1 line-clamp-1">{lesson.title}</span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditLesson(lesson)}><Edit className="w-3.5 h-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteLesson(lesson.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                ))}
                {lessons.length === 0 && !isAddingLesson && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg text-muted-foreground">
                    No lessons yet.
                  </div>
                )}
              </div>
            </div>

            {/* Lesson Editor */}
            <div className="lg:col-span-2">
              {isAddingLesson ? (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <div>
                      <CardTitle>{editingLessonId ? 'Edit Lesson' : 'New Lesson'}</CardTitle>
                      <CardDescription>
                        {editingLessonId ? 'Update your lesson content and quiz.' : 'Add a new lesson to your course using Markdown.'}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant={showPlayground ? "default" : "outline"} 
                        size="sm" 
                        onClick={() => setShowPlayground(!showPlayground)}
                        className="gap-2"
                      >
                        <Code2 className="w-4 h-4" /> Playground
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setPreviewMode(!previewMode)}>
                        {previewMode ? <Edit className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {previewMode ? 'Edit' : 'Preview'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {showPlayground && (
                      <div className="mb-6">
                        <CodePlayground className="h-[400px]" />
                        <p className="text-[10px] text-muted-foreground mt-2">
                          Use this playground to test code snippets before adding them to your lesson content.
                        </p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Lesson Title</label>
                      <Input 
                        placeholder="e.g. Introduction to React Hooks" 
                        value={newLessonTitle}
                        onChange={(e) => setNewLessonTitle(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Content (Markdown supported)</label>
                      {previewMode ? (
                        <div className="min-h-[300px] p-4 border rounded bg-muted/30 prose prose-slate dark:prose-invert max-w-none">
                          <ReactMarkdown>{newLessonContent || "*No content to preview*"}</ReactMarkdown>
                        </div>
                      ) : (
                        <Textarea 
                          placeholder="# Your Lesson Content&#10;&#10;Use markdown to format your lesson. You can include code blocks:&#10;&#10;```javascript&#10;console.log('Hello World');&#10;```" 
                          className="min-h-[300px] font-mono text-sm"
                          value={newLessonContent}
                          onChange={(e) => setNewLessonContent(e.target.value)}
                        />
                      )}
                    </div>

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium flex items-center gap-2">
                          <HelpCircle className="w-4 h-4" /> Lesson Quiz (Optional)
                        </label>
                        <Button variant="outline" size="sm" onClick={addQuizQuestion}>
                          <Plus className="w-3 h-3 mr-1" /> Add Question
                        </Button>
                      </div>

                      {newLessonQuiz.questions.map((q, qIdx) => (
                        <div key={q.id} className="p-4 border rounded-lg bg-muted/20 space-y-4 relative">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="absolute top-2 right-2 h-8 w-8 text-destructive"
                            onClick={() => removeQuizQuestion(qIdx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-medium">Question {qIdx + 1}</label>
                            <Input 
                              placeholder="Enter question" 
                              value={q.question}
                              onChange={(e) => updateQuizQuestion(qIdx, 'question', e.target.value)}
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {q.options.map((option, oIdx) => (
                              <div key={oIdx} className="flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  name={`correct-${q.id}`}
                                  checked={q.correctAnswerIndex === oIdx}
                                  onChange={() => updateQuizQuestion(qIdx, 'correctAnswerIndex', oIdx)}
                                />
                                <Input 
                                  placeholder={`Option ${oIdx + 1}`}
                                  value={option}
                                  onChange={(e) => updateQuizOption(qIdx, oIdx, e.target.value)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-6 flex justify-end gap-3">
                    <Button variant="ghost" onClick={() => {
                      setIsAddingLesson(false);
                      setEditingLessonId(null);
                      setNewLessonTitle('');
                      setNewLessonContent('');
                      setNewLessonQuiz({ questions: [] });
                    }}>Cancel</Button>
                    <Button onClick={handleAddLesson} disabled={saving} className="gap-2">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingLessonId ? <Check className="w-4 h-4" /> : <PlusCircle className="w-4 h-4" />)}
                      {editingLessonId ? 'Update Lesson' : 'Add Lesson to Course'}
                    </Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-xl bg-muted/10">
                  <FileText className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                  <p className="text-muted-foreground mb-4">Select a lesson to edit or add a new one.</p>
                  <Button variant="outline" onClick={() => setIsAddingLesson(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Add Your First Lesson
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
