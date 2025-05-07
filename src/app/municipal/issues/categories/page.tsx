
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tag, Loader2, AlertCircle, Layers } from 'lucide-react';
import Link from 'next/link'; // Import Link
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// MockPost interface to ensure consistency
interface MockPost {
  id: string;
  category: string;
  status: 'pending' | 'solved';
}

// Sample Mock Data (if localStorage is empty or for initialization)
const sampleMockPostsForCategories: MockPost[] = [
  { id: 'mock1', category: 'garbage', status: 'pending' },
  { id: 'mock2', category: 'drainage', status: 'solved' },
  { id: 'mock3', category: 'potholes', status: 'pending' },
  { id: 'mock4', category: 'streetlights', status: 'pending' },
  { id: 'mock5', category: 'garbage', status: 'solved' },
  { id: 'mock6', category: 'other', status: 'pending' },
  { id: 'mock7', category: 'garbage', status: 'pending' },
  { id: 'mock8', category: 'drainage', status: 'pending' },
];

interface CategoryStat {
  name: string;
  total: number;
  pending: number;
  solved: number;
  icon: React.ElementType;
  color: string; // Tailwind color class for border/accent
}

const PREDEFINED_CATEGORIES: { name: string, icon: React.ElementType, color: string }[] = [
  { name: 'garbage', icon: Tag, color: 'border-green-500' },
  { name: 'drainage', icon: Tag, color: 'border-blue-500' },
  { name: 'potholes', icon: Tag, color: 'border-yellow-500' },
  { name: 'streetlights', icon: Tag, color: 'border-purple-500' },
  { name: 'other', icon: Tag, color: 'border-gray-500' },
];

const generateCategoryStats = (posts: MockPost[]): CategoryStat[] => {
  const categoryMap: Record<string, { total: number; pending: number; solved: number }> = {};

  posts.forEach(post => {
    const category = post.category?.toLowerCase() || 'other';
    if (!categoryMap[category]) {
      categoryMap[category] = { total: 0, pending: 0, solved: 0 };
    }
    categoryMap[category].total++;
    if (post.status === 'pending') {
      categoryMap[category].pending++;
    } else {
      categoryMap[category].solved++;
    }
  });

  return PREDEFINED_CATEGORIES.map(catInfo => ({
    ...catInfo,
    total: categoryMap[catInfo.name]?.total || 0,
    pending: categoryMap[catInfo.name]?.pending || 0,
    solved: categoryMap[catInfo.name]?.solved || 0,
  }));
};

export default function IssueCategoriesPage() {
  const [categoryStats, setCategoryStats] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    console.log("Frontend-only mode: Simulating loading category stats from localStorage...");

    const timer = setTimeout(() => {
      try {
        const storedPostsRaw = localStorage.getItem('mockPosts');
        let postsData: MockPost[];

        if (storedPostsRaw) {
          postsData = JSON.parse(storedPostsRaw);
          console.log(`Loaded ${postsData.length} mock posts from localStorage for category stats.`);
        } else {
          postsData = sampleMockPostsForCategories; // Fallback to sample data
          console.log("Using sample mock posts for category stats (localStorage empty).");
        }
        
        // Basic validation
        postsData = postsData.filter(p => p.category && p.status);

        const currentStats = generateCategoryStats(postsData);
        setCategoryStats(currentStats);
        console.log("Category stats updated.", currentStats);

      } catch (err: any) {
        console.error("Error processing category stats:", err);
        setError(`Failed to load category stats (mock): ${err.message}`);
        setCategoryStats(generateCategoryStats(sampleMockPostsForCategories)); // Fallback on error
      } finally {
        setLoading(false);
      }
    }, 700); // Simulate network delay

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <Card className="shadow-lg border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl sm:text-3xl font-bold text-primary">Issue Categories</CardTitle>
          <CardDescription>
            Overview of reported issues by their AI-determined category. Click a category to view its issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-2 text-muted-foreground">Loading categories...</p>
            </div>
          )}
          {error && (
            <div className="text-red-600 bg-red-50 p-4 rounded-md border border-red-200 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>Error: {error}</span>
            </div>
          )}
          {!loading && !error && categoryStats.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              <Layers className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p>No issue categories found or no issues reported yet.</p>
            </div>
          )}
          {!loading && !error && categoryStats.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {categoryStats.map((category) => (
                <Link key={category.name} href={`/municipal/issues/category/${encodeURIComponent(category.name.toLowerCase())}`} passHref>
                  <Card 
                    className={cn(
                      "hover:shadow-xl transition-shadow duration-300 cursor-pointer border-l-4 bg-card",
                      category.color
                    )}
                  >
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-lg font-semibold capitalize text-foreground">
                        {category.name}
                      </CardTitle>
                      <category.icon className="h-6 w-6 text-muted-foreground" />
                    </CardHeader>
                    <CardContent className="space-y-1">
                      <p className="text-2xl font-bold text-primary">{category.total}</p>
                      <p className="text-xs text-muted-foreground">Total Issues Reported</p>
                      <div className="flex justify-between text-xs pt-2">
                        <Badge variant="outline" className="border-orange-400 text-orange-600">Pending: {category.pending}</Badge>
                        <Badge variant="outline" className="border-green-400 text-green-600">Solved: {category.solved}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
