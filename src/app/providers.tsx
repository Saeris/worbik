"use client";

import { ThemeProvider } from "next-themes";
import React from "react";

export const Providers: React.FC<{ readonly children: React.ReactNode }> = ({
  children
}) => <ThemeProvider attribute="class">{children}</ThemeProvider>;
