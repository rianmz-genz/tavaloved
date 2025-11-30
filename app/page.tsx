// file: app/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link"; // Import Link for navigation
import { Search, Star, BookOpen, Clock, X } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

// --- Interfaces (TETAP SAMA) ---
interface Category {
  category: {
    name: string;
  };
}

interface BookTitle {
  id: string;
  title: string;
  author: string;
  synopsis: string;
  coverImage?: string | null;
  avgRating: number;
  categories: Category[];
}

// --- FUNGSI FETCH DATA (TETAP SAMA) ---
const fetchAllBooks = async (): Promise<BookTitle[]> => {
  const response = await fetch("/api/books");
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch collection data: ${errorText}`);
  }
  return response.json();
};

// --- Komponen: Tampilan Grid Buku (TETAP SAMA) ---
const BookGridView = ({ books }: { books: BookTitle[] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 mt-8">
    {books.map((book) => (
     <HoverCard openDelay={0} closeDelay={0} key={book.id}>
        <HoverCardTrigger asChild>
          <Link
            // Navigasi ke halaman detail dengan slug
            href={`/book/${book.id}-${book.title
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
            className="group cursor-pointer bg-card rounded-xl shadow-lg transition-all duration-300 transform hover:scale-[1.03] hover:shadow-2xl overflow-hidden"
          >
            <div className="relative w-full aspect-[1/1.5] overflow-hidden">
              <Image
                src={
                  book.coverImage ||
                  "https://placehold.co/150x220/f9a8d4/111?text=No+Cover"
                }
                alt={book.title}
                layout="fill"
                objectFit="cover"
                className="transition-transform duration-300 group-hover:scale-[1.05]"
                unoptimized
              />
              {/* Rating Badge */}
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full shadow-md flex items-center">
                <Star className="w-3 h-3 fill-current mr-1" />
                {book.avgRating.toFixed(1)}
              </div>
            </div>
            <div className="p-3 text-center">
              <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                {book.title}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {book.author}
              </p>
            </div>
          </Link>
        </HoverCardTrigger>
        
        {/* --- KONTEN HOVER CARD --- */}
        <HoverCardContent 
            className="w-80 p-4 shadow-2xl rounded-lg border-primary/20"
            side="right" 
            align="start"
            avoidCollisions={false}
        >
            <div className="flex justify-between items-start mb-2">
                <h4 className="text-lg font-bold text-primary leading-tight">
                    {book.title}
                </h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3 italic line-clamp-4">
                {book.synopsis || "Sinopsis tidak tersedia."}
            </p>

            <div className="flex flex-wrap gap-1 mt-2">
                {book.categories.slice(0, 3).map((cat, index) => (
                    <span 
                        key={index} 
                        className="text-xs px-2 py-0.5 bg-secondary text-secondary-foreground rounded-full"
                    >
                        {cat.category.name}
                    </span>
                ))}
                {book.categories.length > 3 && (
                    <span className="text-xs px-2 py-0.5 bg-zinc-100 text-zinc-500 rounded-full">
                        +{book.categories.length - 3} lainnya
                    </span>
                )}
            </div>

            <p className="text-sm mt-3 text-foreground font-semibold flex items-center">
                Rating: <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 ml-1" /> {book.avgRating.toFixed(1)}
            </p>
        </HoverCardContent>
        {/* --------------------------- */}
      </HoverCard>
    ))}
  </div>
);

// --- Halaman Utama (Home) ---
export default function Home() {
  const [allBooks, setAllBooks] = useState<BookTitle[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBooks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAllBooks();
      setAllBooks(data);
    } catch (e: any) {
      console.error("Failed to load initial books:", e);
      setError(`Failed to load book collection from server: ${e.message}`);
      setAllBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBooks();
  }, [loadBooks]);

  // --- LOGIKA FILTERING ---
  const filteredBooks = useMemo(() => {
    if (!searchTerm) {
      return allBooks;
    }
    const query = searchTerm.toLowerCase();

    return allBooks.filter((book) => {
      const matchesTitleOrAuthor =
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query);

      const matchesCategory = book.categories.some((cat) =>
        cat.category.name.toLowerCase().includes(query)
      );

      return matchesTitleOrAuthor || matchesCategory;
    });
  }, [allBooks, searchTerm]);
  // ------------------------------------

  return (
    <div className="flex min-h-screen flex-col justify-between bg-secondary/30 dark:bg-zinc-950 font-sans">
      {" "}
      {/* Gunakan flex-col justify-between */}
      <main className="grow w-full max-w-7xl px-4 py-12 mx-auto">
        <header className="text-center mb-12">
          {/* GANTI DENGAN LOGO */}
          <div className="flex justify-center items-center flex-col">
            <Image
              src="/assets/img/tavaloved.webp"
              alt="TAVALOVEd Library Logo"
              width={80}
              height={80}
              className="rounded-full shadow-lg mb-2 border-2 border-primary/50"
              unoptimized
            />
          </div>

          <p className="text-xl text-zinc-600 dark:text-zinc-400 mt-2">
            Find inspiration and new stories from our collection.
          </p>
        </header>

        {/* Search Bar */}
        <div className="max-w-xl mx-auto mb-10">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by title, author, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-border bg-card rounded-full shadow-inner focus:ring-2 focus:ring-primary focus:border-primary transition"
            />
          </div>
        </div>

        {error && (
          <div className="text-center p-6 bg-red-100 dark:bg-red-900 border border-red-400 rounded-lg mb-8">
            <p className="text-lg text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {isLoading ? (
          <div className="text-center p-20">
            <p className="text-xl text-primary font-medium">
              Loading Collection...
            </p>
            <Clock className="w-8 h-8 mx-auto mt-4 animate-spin text-primary/70" />
          </div>
        ) : (
          // Tampilan Grid
          <>
            <h2 className="text-3xl font-medium text-foreground mb-6 flex items-center">
              <BookOpen className="w-6 h-6 mr-3 text-primary" />
              {searchTerm
                ? `Search Results (${filteredBooks.length})`
                : `Latest Collection (${filteredBooks.length})`}
            </h2>
            {filteredBooks.length > 0 ? (
              <BookGridView books={filteredBooks} />
            ) : (
              <div className="text-center p-20 bg-card rounded-xl">
                <p className="text-xl text-muted-foreground">
                  {searchTerm
                    ? `No results found for "${searchTerm}".`
                    : "Book collection is empty. Try adding data in the Admin Panel."}
                </p>
              </div>
            )}
          </>
        )}
      </main>
      {/* --- FOOTER BARU --- */}
      <footer className="w-full bg-card py-6 border-t border-border mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          &copy; {new Date().getFullYear()} Tavaloved Library. All rights
          reserved.
          <p className="mt-1 text-xs">
            Made with ❤️ by <strong>Adrian</strong> and  <strong>Vinka</strong>. 
          </p>
        </div>
      </footer>
    </div>
  );
}
