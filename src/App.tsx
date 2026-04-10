import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logout } from './firebase';
import { getUserProfile, createUserProfile } from './lib/firebase-utils';
import { UserProfile } from './types';
import { Button } from './components/ui/button';
import { 
  BookOpen, 
  Search, 
  PlusCircle, 
  LayoutDashboard, 
  LogOut, 
  LogIn, 
  Menu, 
  X,
  GraduationCap,
  Code2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner';

// Pages
import Home from './pages/Home';
import CourseExplorer from './pages/CourseExplorer';
import CourseViewer from './pages/CourseViewer';
import Dashboard from './pages/Dashboard';
import CreateCourse from './pages/CreateCourse';
import AdminPanel from './pages/AdminPanel';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        let userProfile = await getUserProfile(firebaseUser.uid);
        if (!userProfile) {
          userProfile = await createUserProfile(firebaseUser);
        }
        setProfile(userProfile);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      toast.success("Successfully logged in!");
    } catch (error) {
      toast.error("Failed to login");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Failed to logout");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin">
          <Code2 className="w-12 h-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-background flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-lg">
                <GraduationCap className="w-6 h-6" />
              </div>
              <span>EduCode</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/explore" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                <Search className="w-4 h-4" /> Explore
              </Link>
              {user && (
                <>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" /> Admin
                    </Link>
                  )}
                  <Link to="/dashboard" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  {(profile?.role === 'instructor' || profile?.role === 'admin') && (
                    <Link to="/create" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
                      <PlusCircle className="w-4 h-4" /> Create
                    </Link>
                  )}
                </>
              )}
            </nav>

            <div className="hidden md:flex items-center gap-4">
              {user ? (
                <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-medium">{profile?.displayName}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">{profile?.role}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              ) : (
                <Button onClick={handleLogin} className="gap-2">
                  <LogIn className="w-4 h-4" /> Login
                </Button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {/* Mobile Nav */}
          {isMenuOpen && (
            <div className="md:hidden border-b bg-background">
              <div className="container mx-auto px-4 py-4 flex flex-col gap-4">
                  <Link to="/explore" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 font-medium">
                    <Search className="w-5 h-5" /> Explore
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 font-medium">
                      <ShieldCheck className="w-5 h-5" /> Admin Panel
                    </Link>
                  )}
                  {user && (
                    <>
                      <Link to="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 font-medium">
                        <LayoutDashboard className="w-5 h-5" /> Dashboard
                      </Link>
                      {(profile?.role === 'instructor' || profile?.role === 'admin') && (
                        <Link to="/create" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2 py-2 font-medium">
                          <PlusCircle className="w-5 h-5" /> Create
                        </Link>
                      )}
                    </>
                  )}
                  <div className="pt-2 border-t">
                    {user ? (
                      <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { handleLogout(); setIsMenuOpen(false); }}>
                        <LogOut className="w-5 h-5" /> Logout
                      </Button>
                    ) : (
                      <Button className="w-full justify-start gap-2" onClick={() => { handleLogin(); setIsMenuOpen(false); }}>
                        <LogIn className="w-5 h-5" /> Login
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<CourseExplorer />} />
            <Route path="/course/:courseId" element={<CourseViewer />} />
            <Route path="/dashboard" element={<Dashboard user={user} profile={profile} />} />
            <Route path="/create" element={<CreateCourse user={user} profile={profile} />} />
            <Route path="/edit/:courseId" element={<CreateCourse user={user} profile={profile} />} />
            <Route path="/admin" element={<AdminPanel user={user} profile={profile} />} />
          </Routes>
        </main>

        <footer className="border-t py-12 bg-muted/30">
          <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-2 font-bold text-xl mb-4">
                <GraduationCap className="w-6 h-6 text-primary" />
                <span>EduCode</span>
              </Link>
              <p className="text-muted-foreground max-w-sm">
                The world's largest web developer site. Learn HTML, CSS, JavaScript, React, and more with our community-driven courses.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/explore" className="hover:text-primary">All Courses</Link></li>
                <li><Link to="/create" className="hover:text-primary">Become an Instructor</Link></li>
                <li><Link to="#" className="hover:text-primary">Community</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary">Help Center</Link></li>
                <li><Link to="#" className="hover:text-primary">Privacy Policy</Link></li>
                <li><Link to="#" className="hover:text-primary">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="container mx-auto px-4 mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} EduCode Portal. Inspired by W3Schools.
          </div>
        </footer>
        <Toaster position="top-center" />
      </div>
    </Router>
  );
}
