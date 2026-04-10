import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, buttonVariants } from '../components/ui/button';
import { cn } from '../lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { getCourses } from '../lib/firebase-utils';
import { Course, CATEGORIES } from '../types';
import { 
  ArrowRight, 
  Code2, 
  Globe, 
  Zap, 
  Users, 
  BookOpen, 
  Search,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

export default function Home() {
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);

  useEffect(() => {
    const unsubscribe = getCourses((courses) => {
      setFeaturedCourses(courses.slice(0, 3));
    });
    return () => unsubscribe();
  }, []);

  const features = [
    {
      icon: <Code2 className="w-8 h-8 text-primary" />,
      title: "Learn by Doing",
      description: "Interactive lessons with real-world code examples and exercises."
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      title: "Community Driven",
      description: "Courses created by professionals and educators from around the globe."
    },
    {
      icon: <Zap className="w-8 h-8 text-primary" />,
      title: "Up-to-Date Content",
      description: "Stay current with the latest web technologies and best practices."
    }
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-muted/30">
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(var(--primary),0.1),transparent_50%)]" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div>
              <Badge variant="outline" className="mb-4 px-4 py-1 border-primary/20 bg-primary/5 text-primary">
                The Future of Web Learning
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Master Web Development <br />
                <span className="text-primary">One Lesson at a Time</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 leading-relaxed">
                Join thousands of students learning HTML, CSS, JavaScript, and more. 
                Create your own courses and share your knowledge with the world.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/explore" className={cn(buttonVariants({ size: "lg" }), "px-8 h-12 text-lg")}>
                  Start Learning <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <Link to="/create" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "px-8 h-12 text-lg")}>
                  Create a Course
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 border-y bg-background">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-4">
            {CATEGORIES.slice(0, 8).map((cat) => (
              <Link 
                key={cat} 
                to={`/explore?category=${cat}`}
                className="px-6 py-3 rounded-full border bg-card hover:border-primary hover:text-primary transition-all font-medium flex items-center gap-2 shadow-sm"
              >
                {cat}
              </Link>
            ))}
            <Link 
              to="/explore"
              className="px-6 py-3 rounded-full border bg-primary text-primary-foreground hover:bg-primary/90 transition-all font-medium flex items-center gap-2 shadow-sm"
            >
              All Categories <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why Choose EduCode?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We provide the tools and content you need to go from beginner to professional in web development.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-2xl border bg-card hover:shadow-lg transition-shadow"
              >
                <div className="mb-6 p-3 bg-primary/5 rounded-xl inline-block">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Featured Courses</h2>
              <p className="text-muted-foreground">Hand-picked courses to kickstart your journey.</p>
            </div>
            <Link to="/explore" className={cn(buttonVariants({ variant: "ghost" }), "hidden sm:flex")}>
              View All <ArrowRight className="ml-2 w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCourses.length > 0 ? (
              featuredCourses.map((course) => (
                <Card key={course.id} className="overflow-hidden flex flex-col hover:shadow-xl transition-shadow border-primary/10">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    <img 
                      src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/450`} 
                      alt={course.title}
                      className="object-cover w-full h-full"
                      referrerPolicy="no-referrer"
                    />
                    <Badge className="absolute top-4 right-4 bg-background/80 backdrop-blur text-foreground border-none">
                      {course.category}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1">{course.title}</CardTitle>
                    <CardDescription className="line-clamp-2">{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>{course.lessonCount} Lessons</span>
                    </div>
                  </CardContent>
                  <CardFooter className="border-t bg-muted/10 pt-4">
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <img 
                          src={course.instructorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.instructorId}`} 
                          alt={course.instructorName}
                          className="w-6 h-6 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-xs font-medium">{course.instructorName}</span>
                      </div>
                      <Link to={`/course/${course.id}`} className={cn(buttonVariants({ size: "sm" }))}>
                        Learn Now
                      </Link>
                    </div>
                  </CardFooter>
                </Card>
              ))
            ) : (
              <div className="col-span-3 text-center py-12">
                <p className="text-muted-foreground">No courses available yet. Be the first to create one!</p>
              <Link to="/create" className={cn(buttonVariants(), "mt-4")}>Create Course</Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Ready to Start Your Career?</h2>
          <p className="text-xl opacity-90 mb-10 max-w-2xl mx-auto">
            Join our community of developers and start learning the most in-demand skills in the industry today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/explore" className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "px-8 h-12 text-lg")}>
              Explore Courses
            </Link>
            <Link to="/create" className={cn(buttonVariants({ size: "lg", variant: "outline" }), "px-8 h-12 text-lg border-primary-foreground/20 hover:bg-primary-foreground/10 text-primary-foreground")}>
              Start Teaching
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
