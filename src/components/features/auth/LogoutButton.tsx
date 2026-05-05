'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LogoutButtonProps {
  locale: string;
  label: string;
}

export function LogoutButton({ locale, label }: LogoutButtonProps) {
  const router = useRouter();

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm text-[rgba(80,80,110,0.7)] hover:text-[rgba(40,40,55,0.88)] transition-colors"
    >
      {label}
    </button>
  );
}
