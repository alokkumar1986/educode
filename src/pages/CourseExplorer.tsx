import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { getCourses } from '../lib/firebase-utils';
import { Course, CATEGORIES } from '../types';
import { Input } from '../components/ui/input';
import { Button, buttonVariants } from '../components/ui/button';
import { cn } from '../lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Search, Filter, BookOpen, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function CourseExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const categoryFilter = searchParams.get('category') || 'All';

  useEffect(() => {
    const unsubscribe = getCourses((data) => {
      setCourses(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let result = courses;

    if (categoryFilter !== 'All') {
      result = result.filter(c => c.category === categoryFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.title.toLowerCase().includes(query) || 
        c.description.toLowerCase().includes(query) ||
        c.instructorName.toLowerCase().includes(query)
      );
    }

    setFilteredCourses(result);
  }, [courses, categoryFilter, searchQuery]);

  const handleCategoryChange = (cat: string) => {
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-bold mb-2">Explore Courses</h1>
          <p className="text-muted-foreground">Find the perfect course to advance your skills.</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search courses, instructors..." 
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="sticky top-24 space-y-6">
            <div>
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Categories
              </h3>
              <div className="flex flex-wrap lg:flex-col gap-2">
                <Button 
                  variant={categoryFilter === 'All' ? 'default' : 'ghost'} 
                  size="sm"
                  className="justify-start"
                  onClick={() => handleCategoryChange('All')}
                >
                  All Categories
                </Button>
                {CATEGORIES.map((cat) => (
                  <Button 
                    key={cat}
                    variant={categoryFilter === cat ? 'default' : 'ghost'} 
                    size="sm"
                    className="justify-start"
                    onClick={() => handleCategoryChange(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Course Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading courses...</p>
            </div>
          ) : filteredCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      <img 
                        src={course.thumbnail || `https://picsum.photos/seed/${course.id}/800/450`} 
                        alt={course.title}
                        className="object-cover w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                      <Badge className="absolute top-3 right-3">{course.category}</Badge>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                      <CardDescription className="line-clamp-2 text-xs h-8">{course.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-4 flex-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{course.lessonCount} Lessons</span>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-4 border-t flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img 
                          src={course.instructorPhoto || `https://api.dicebear.com/7.x/avataaars/svg?seed=${course.instructorId}`} 
                          alt={course.instructorName}
                          className="w-5 h-5 rounded-full"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[10px] font-medium">{course.instructorName}</span>
                      </div>
                      <Link to={`/course/${course.id}`} className={cn(buttonVariants({ size: "sm", variant: "outline" }), "h-8 text-xs")}>
                        View Course
                      </Link>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border rounded-xl bg-muted/20">
              <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-bold mb-2">No courses found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters.</p>
              <Button variant="link" onClick={() => { setSearchQuery(''); handleCategoryChange('All'); }}>
                Clear all filters
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
