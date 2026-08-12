"use client";

import React from "react";
import Link from "next/link";

export const FormattedText = ({ text }: { text: string }) => {
  if (!text) return null;

  // Split text by URLs, hashtags, and mentions
  // Matches http://..., https://..., www..., and #hashtag, @mention (preceded by start of line or whitespace)
  const regex = /(https?:\/\/[^\s]+|www\.[^\s]+|(?:^|\s)[#@][\w0-9_]+)/gi;
  
  const parts = text.split(regex);

  return (
    <span className="whitespace-pre-wrap break-words leading-relaxed">
      {parts.map((part, i) => {
        if (!part) return null;

        const trimmedPart = part.trim();
        const leadingSpace = part.startsWith(" ") ? " " : "";

        const isHttpUrl = trimmedPart.toLowerCase().startsWith("http://") || trimmedPart.toLowerCase().startsWith("https://");
        const isW3Url = trimmedPart.toLowerCase().startsWith("www.");

        if (isHttpUrl || isW3Url) {
          let href = trimmedPart;
          let textToShow = trimmedPart;
          let trailingPunctuation = "";
          
          const trailingPuncMatch = href.match(/([.,!?;:]+)$/);
          if (trailingPuncMatch) {
            trailingPunctuation = trailingPuncMatch[1];
            href = href.slice(0, -trailingPunctuation.length);
            textToShow = href;
          }

          if (href.toLowerCase().startsWith("www.")) {
            href = "https://" + href;
          }
          
          let isInternal = false;
          let internalPath = "";
          try {
            const urlObj = new URL(href);
            if (typeof window !== "undefined" && urlObj.host === window.location.host) {
              isInternal = true;
              internalPath = urlObj.pathname + urlObj.search + urlObj.hash;
            }
          } catch (e) {}

          const linkEl = isInternal ? (
            <Link
              href={internalPath}
              className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
            >
              {textToShow}
            </Link>
          ) : (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 dark:text-purple-400 font-bold hover:underline"
            >
              {textToShow}
            </a>
          );

          return (
            <React.Fragment key={i}>
              {leadingSpace}
              {linkEl}
              {trailingPunctuation}
            </React.Fragment>
          );
        } else if (trimmedPart.startsWith("#")) {
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
