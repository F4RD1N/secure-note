import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { FileWarning } from 'lucide-react';

export default function NoteExpiredPage() {
  return (
    <div className="w-full flex items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="flex flex-col items-center gap-2">
            <FileWarning className="w-12 h-12 text-destructive" />
            یادداشت در دسترس نیست
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            این یادداشت منقضی شده، به حد مجاز بازدید رسیده یا حذف شده است.
          </p>
          <Button asChild>
            <Link href="/">ایجاد یادداشت جدید</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
