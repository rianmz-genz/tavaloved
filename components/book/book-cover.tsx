"use client";
import { BookTitle } from "@/app/book/[slug]/page";
import { Star } from "lucide-react";
import { SessionProvider } from "next-auth/react";
import Image from "next/image";
import { BorrowingModule } from "./borrowing-module";

const BookCover = ({ detail }: { detail: BookTitle }) => {
  return (
    <div className="shrink-0 w-full md:w-1/3">
      <Image
        src={
          detail.coverImage ||
          "https://placehold.co/150x220/f9a8d4/111?text=No+Cover"
        }
        alt={detail.title}
        width={250}
        height={350}
        className="rounded-lg shadow-2xl object-cover w-full h-auto mx-auto"
        unoptimized
      />
      <div className="mt-4 text-center">
        <span className="flex items-center justify-center text-lg font-bold text-yellow-500">
          <Star className="w-5 h-5 mr-1" fill="currentColor" />{" "}
          {detail.avgRating.toFixed(1)}
        </span>
      </div>
      <SessionProvider>
        <BorrowingModule book={detail} />
      </SessionProvider>
    </div>
  );
};

export default BookCover;
