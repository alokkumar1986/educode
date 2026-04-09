import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User } from 'firebase/auth';
import { getAllCourses, getAllUsers, deleteCourse, updateCourse, updateUserRole } from '../lib/firebase-utils';
import { Course, UserProfile } from '../types';
import { Button, buttonVariants } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { 
  ShieldCheck, 
  Users, 
  BookOpen, 
  Trash2, 
  Edit, 
  Eye, 
  MoreVertical, 
  CheckCircle, 
  XCircle,
  Loader2,
  Search,
  Filter,
  UserCog
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '../components/ui/dropdown-menu';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface AdminPanelProps {
  user: User | null;
  profile: UserProfile | null;
}

export default function AdminPanel({ user, profile }: AdminPanelProps) {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!profile || profile.role !== 'admin') {
      navigate('/');
      return;
    }

    const unsubCourses = getAllCourses(setCourses);
    const unsubUsers = getAllUsers((data) => {
      setUsers(data);
      setLoading(false);
    });

    return () => {
      unsubCourses();
      unsubUsers();
    };
  }, [profile, navigate]);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteCourse = async (id: string) => {
    if (deletingId !== id) {
      setDeletingId(id);
      toast.info("Click again to confirm deletion");
      setTimeout(() => setDeletingId(null), 3000);
      return;
    }

    try {
      await deleteCourse(id);
      toast.success("Course deleted successfully");
      setDeletingId(null);
    } catch (error) {
      toast.error("Failed to delete course");
    }
  };

  const togglePublish = async (course: Course) => {
    try {
      await updateCourse(course.id, { published: !course.published });
      toast.success(course.published ? "Course unpublished" : "Course published!");
    } catch (error) {
      toast.error("Failed to update course status");
    }
  };

  const handleRoleChange = async (uid: string, newRole: 'student' | 'instructor' | 'admin') => {
    try {
      await updateUserRole(uid, newRole);
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error("Failed to update user role");
    }
  };

  const filteredCourses = courses.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.instructorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <div className="bg-primary/10 p-3 rounded-xl">
            <ShieldCheck className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground">Manage all courses and users on the platform.</p>
          </div>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search courses or users..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="mb-8">
          <TabsTrigger value="courses" className="gap-2">
            <BookOpen className="w-4 h-4" /> All Courses ({courses.length})
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" /> Users ({users.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          <div className="grid grid-cols-1 gap-4">
            {filteredCourses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="w-full md:w-48 aspect-video md:aspect-square shrink-0">
                    <img 
                      src={course.thumbnail || `https://picsum.photos/seed/${course.id}/400/400`} 
                      alt={course.title}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="flex-1 p-6 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={course.published ? "default" : "secondary"}>
                            {course.published ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant="outline">{course.category}</Badge>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/edit/${course.id}`)} className="flex items-center gap-2">
                              <Edit className="w-4 h-4" /> Edit Content
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/course/${course.id}`)} className="flex items-center gap-2">
                              <Eye className="w-4 h-4" /> View as Student
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePublish(course)} className="flex items-center gap-2">
                              {course.published ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                              {course.published ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteCourse(course.id)}
                              className={cn(
                                "flex items-center gap-2 text-destructive focus:text-destructive",
                                deletingId === course.id && "bg-destructive text-destructive-foreground focus:bg-destructive focus:text-destructive-foreground font-bold"
                              )}
                            >
                              <Trash2 className="w-4 h-4" /> 
                              {deletingId === course.id ? "CONFIRM DELETE" : "Delete Course"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <h3 className="text-xl font-bold mb-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{course.description}</p>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {course.instructorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" /> {course.lessonCount} Lessons
                        </span>
                      </div>
                      <span>ID: {course.id}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {filteredCourses.length === 0 && (
              <div className="text-center py-20 border-2 border-dashed rounded-xl">
                <p className="text-muted-foreground">No courses found matching your search.</p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users">
          <div className="border rounded-xl overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">User</th>
                  <th className="text-left p-4 font-medium">Email</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Joined</th>
                  <th className="text-right p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 border">
                          {u.photoURL ? (
                            <img src={u.photoURL} alt={u.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold">
                              {u.displayName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <span className="font-medium">{u.displayName}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{u.email}</td>
                    <td className="p-4">
                      <Badge variant={u.role === 'admin' ? 'default' : u.role === 'instructor' ? 'secondary' : 'outline'} className="capitalize">
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(u.createdAt?.seconds * 1000).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger>
                          <Button variant="ghost" size="icon">
                            <UserCog className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleRoleChange(u.uid, 'student')}>
                            Make Student
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(u.uid, 'instructor')}>
                            Make Instructor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleRoleChange(u.uid, 'admin')}>
                            Make Admin
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredUsers.length === 0 && (
              <div className="text-center py-20">
                <p className="text-muted-foreground">No users found matching your search.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
