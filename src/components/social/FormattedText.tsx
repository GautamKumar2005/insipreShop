"use client";

import React from "react";
import Link from "next/link";

export const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;

  // Split text by hashtags and mentions
  // This regex matches things like #world, #today, @john, @user123
  // It ensures the match is at the start of the string or preceded by a space
  const regex = /((?:^|\s)[#@][\w0-9_]+)/g;
  
  const parts = text.split(regex);

  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((part, i) => {
        if (!part) return null;

        // Check if the part (which might include a leading space) starts with # or @
        const trimmedPart = part.trim();
        const leadingSpace = part.startsWith(" ") ? " " : "";

        if (trimmedPart.startsWith("#")) {
          return (
            <React.Fragment key={i}>
              {leadingSpace}
              <Link
                href={`/social?search=${encodeURIComponent(trimmedPart)}`}
                className="text-purple-600 dark:text-purple-400 font-black hover:underline px-0.5"
              >
                {trimmedPart}
              </Link>
            </React.Fragment>
          );
        } else if (trimmedPart.startsWith("@")) {
          return (
            <React.Fragment key={i}>
              {leadingSpace}
              <Link
                href={`/social?search=${encodeURIComponent(trimmedPart)}`}
                className="text-orange-500 dark:text-orange-400 font-black hover:underline px-0.5"
              >
                {trimmedPart}
              </Link>
            </React.Fragment>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};
