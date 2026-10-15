"use client";
import { useLearning } from "./learning-state";

export default function ProfileAvatar({ className = "", label = "آواتار زبان‌آموز" }: { className?: string; label?: string }) {
  const { profileAvatar } = useLearning();
  return <span className={`profile-avatar ${className}`.trim()} role="img" aria-label={label}>{profileAvatar}</span>;
}
