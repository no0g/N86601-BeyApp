"use client";

import { useEffect, useState } from "react";

const APP_TIME_ZONE = "Asia/Jakarta";

function formatInBrowserTimezone(value) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: APP_TIME_ZONE
  }).format(new Date(value));
}

export function LocalDateTime({ value, className = "" }) {
  const [formatted, setFormatted] = useState("");

  useEffect(() => {
    setFormatted(formatInBrowserTimezone(value));
  }, [value]);

  return (
    <time dateTime={new Date(value).toISOString()} className={className} suppressHydrationWarning>
      {formatted || formatInBrowserTimezone(value)}
    </time>
  );
}
