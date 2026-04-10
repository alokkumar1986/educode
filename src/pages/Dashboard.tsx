import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User } from 'firebase/auth';
import { getMyCourses, updateCourse, getCourses } from '../lib/firebase-utils';
import { Course, UserProfile, UserProgress } from '../types';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Button, buttonVariants } from '../components/ui/button';
import { cn } from '../lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  PlusCircle, 
  BookOpen, 
  Edit, 
  Eye, 
  MoreVertical, 
  Trash2, 
  CheckCircle, 
  Clock,
  Settings,
  User as UserIcon,
  Loader2,
  GraduationCap,
  PlayCircle
} from 'lucide-react';
import { getDoc, doc } from 'firebase/firestore';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';

interface DashboardProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function Dashboard({ user, profile }: DashboardProps) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrolledCourses, setEnrolledCourses] = useState<(Course & { progress?: UserProgress })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    const unsubscribe = getMyCourses(user.uid, (data) => {
      setCourses(data);
    });

    const fetchEnrolledCourses = async () => {
      try {
        // Fetch progress documents for this user
        const progressQuery = query(collection(db, 'progress'), where('userId', '==', user.uid));
        const progressSnap = await getDocs(progressQuery);
        const progressData = progressSnap.docs.map(doc => doc.data() as UserProgress);
        
        if (progressData.length > 0) {
          const courseIds = progressData.map(p => p.courseId);
          // Fetch course details for these IDs
          const coursesPromises = courseIds.map(async (id) => {
            const courseRef = doc(db, 'courses', id);
            const courseSnap = await getDoc(courseRef);
            if (courseSnap.exists()) {
              const course = { id: courseSnap.id, ...courseSnap.data() } as Course;
              const progress = progressData.find(p => p.courseId === id);
              return { ...course, progress };
            }
            return null;
          });
          
          const resolvedCourses = (await Promise.all(coursesPromises)).filter(c => c !== null) as (Course & { progress?: UserProgress })[];
          setEnrolledCourses(resolvedCourses);
        }
      } catch (error) {
        console.error("Error fetching enrolled courses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();

    return () => unsubscribe();
  }, [user, navigate]);

  const togglePublish = async (course: Course) => {
    try {
      await updateCourse(course.id, { published: !course.published });
      toast.success(course.published ? "Course unpublished" : "Course published!");
    } catch (error) {
      toast.error("Failed to update course status");
    }
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 overflow-hidden">
            {profile?.photoURL ? (
              <img src={profile.photoURL} alt={profile.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <UserIcon className="w-8 h-8 text-primary" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold">{profile?.displayName}</h1>
            <p className="text-muted-foreground">{profile?.email} • <span className="capitalize">{profile?.role}</span></p>
          </div>
        </div>
        {(profile?.role === 'instructor' || profile?.role === 'admin') && (
          <Link to="/create" className={cn(buttonVariants(), "gap-2")}>
            <PlusCircle className="w-4 h-4" /> Create New Course
          </Link>
        )}
      </div>

      <Tabs defaultValue={profile?.role === 'student' ? 'learning' : 'my-courses'} className="w-full">
        <TabsList className="mb-8">
          {(profile?.role === 'instructor' || profile?.role === 'admin') && (
            <TabsTrigger value="my-courses" className="gap-2">
              <BookOpen className="w-4 h-4" /> My Courses
            </TabsTrigger>
          )}
          <TabsTrigger value="learning" className="gap-2">
            <GraduationCap className="w-4 h-4" /> Learning Progress
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="w-4 h-4" /> Account Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learning">
          {enrolledCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => {
                const percent = Math.round(((course.progress?.completedLessons.length || 0) / (course.lessonCount || 1)) * 100);
                return (
                  <Card key={course.id} className="flex flex-col overflow-hidden">
                    <div className="aspect-video bg-muted relative">
                      <img 
                        src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/450`} 
                        alt={course.title}
                        className="object-cover w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Link to={`/course/${course.id}`} className={cn(buttonVariants({ variant: "secondary" }), "gap-2")}>
                          <PlayCircle className="w-4 h-4" /> Continue Learning
                        </Link>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <Badge className="w-fit mb-2">{course.category}</Badge>
                      <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="text-xs">By {course.instructorName}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4 flex-1">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">{percent}%</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div 
                            style={{ width: `${percent}%` }}
                            className="bg-primary h-full"
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 border-t">
                      <Link to={`/course/${course.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}>
                        View Course Content
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
              <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">You haven't started any courses yet</h3>
              <p className="text-muted-foreground mb-6">Explore our catalog and start your learning journey today.</p>
              <Link to="/explore" className={cn(buttonVariants())}>Explore Courses</Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="my-courses">
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.id} className="flex flex-col">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img 
                      src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/450`} 
                      alt={course.title}
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      <Badge variant={course.published ? "default" : "secondary"}>
                        {course.published ? "Published" : "Draft"}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/edit/${course.id}`)} className="flex items-center gap-2">
                            <Edit className="w-4 h-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/course/${course.id}`)} className="flex items-center gap-2">
                            <Eye className="w-4 h-4" /> View Course
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePublish(course)} className="flex items-center gap-2">
                            {course.published ? (
                              <><Clock className="w-4 h-4" /> Unpublish</>
                            ) : (
                              <><CheckCircle className="w-4 h-4" /> Publish</>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="flex items-center gap-2 text-destructive focus:text-destructive">
                            <Trash2 className="w-4 h-4" /> Delete Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardDescription className="line-clamp-2 text-xs h-8">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-4 flex-1">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{course.lessonCount} Lessons</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Updated {new Date(course.updatedAt?.seconds * 1000).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t">
                    <Link to={`/edit/${course.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full gap-2")}>
                      <Edit className="w-4 h-4" /> Manage Content
                    </Link>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border-2 border-dashed rounded-xl bg-muted/20">
              <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">You haven't created any courses yet</h3>
              <p className="text-muted-foreground mb-6">Share your knowledge with the world by creating your first course.</p>
              <Link to="/create" className={cn(buttonVariants())}>Create Your First Course</Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your public profile and account preferences.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Display Name</label>
                  <div className="p-2 border rounded bg-muted/30">{profile?.displayName}</div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address</label>
                  <div className="p-2 border rounded bg-muted/30">{profile?.email}</div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Account Role</label>
                <div className="p-2 border rounded bg-muted/30 capitalize">{profile?.role}</div>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-6">
              <Button variant="outline" disabled>Update Profile (Coming Soon)</Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
