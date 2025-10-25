'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import QRCode from 'qrcode.react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createNote } from '@/lib/actions';
import { encrypt } from '@/lib/crypto';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Copy, Loader2, Link as LinkIcon, Share2 } from 'lucide-react';
import { nanoid } from 'nanoid';

const formSchema = z.object({
  content: z.string().min(1, 'یادداشت نمی‌تواند خالی باشد.'),
  password: z.string().optional(),
  expireValue: z.coerce.number().min(1).optional(),
  expireUnit: z.enum(['minutes', 'hours', 'days']).optional(),
  views: z.coerce.number().min(1).optional(),
  deleteAfterFirstView: z.boolean().default(false),
});

type FormValues = z.infer<typeof formSchema>;

export default function NoteCreator() {
  const [noteLink, setNoteLink] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: '',
      password: '',
      expireUnit: 'hours',
      deleteAfterFirstView: false,
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    try {
      const hasPassword = !!data.password;
      let key = '';
      let salt = null;

      if (hasPassword) {
        key = data.password as string;
      } else {
        key = nanoid(32);
      }

      const { ciphertext, iv, salt: returnedSalt } = encrypt(data.content, key);
      salt = returnedSalt;

      let expiresAt: number | null = null;
      if (data.expireValue && data.expireUnit) {
        const now = new Date();
        const multiplier = {
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000,
        };
        expiresAt = now.getTime() + data.expireValue * multiplier[data.expireUnit];
      }

      let viewsRemaining = data.views ? data.views : null;
      if (data.deleteAfterFirstView) {
        viewsRemaining = 1;
      }

      const result = await createNote({
        content: ciphertext,
        iv,
        salt,
        hasPassword,
        expiresAt,
        viewsRemaining,
      });

      if (result.id) {
        const link = `${window.location.origin}/n/${result.id}${!hasPassword ? `#${key}` : ''}`;
        setNoteLink(link);
      } else {
        throw new Error('ایجاد یادداشت ناموفق بود.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'امکان ایجاد یادداشت وجود ندارد. لطفاً دوباره تلاش کنید.',
      });
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (noteLink) {
      navigator.clipboard.writeText(noteLink);
      toast({
        title: 'کپی شد!',
        description: 'لینک یادداشت در کلیپ‌بورد شما کپی شد.',
      });
    }
  };
  
  const shareLink = () => {
    if (navigator.share && noteLink) {
      navigator.share({
        title: 'لینک یادداشت سریع',
        text: 'یک یادداشت امن برای شما:',
        url: noteLink,
      }).catch(error => console.log('خطا در اشتراک‌گذاری:', error));
    } else {
      copyToClipboard();
    }
  };


  if (noteLink) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-6 w-6 text-primary" />
              لینک ایجاد شد!
            </CardTitle>
            <CardDescription>یادداشت امن شما آماده اشتراک‌گذاری است.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              <QRCode value={noteLink} size={160} bgColor="transparent" fgColor="#FFFFFF" className="p-2 bg-white/10 rounded-lg border border-white/20"/>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <Input value={noteLink} readOnly className="flex-1 text-left bg-black/20" dir="ltr" />
              <Button variant="outline" size="icon" onClick={copyToClipboard} aria-label="کپی لینک">
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
                <Button onClick={shareLink} className="w-full">
                    <Share2 className="mr-2 h-4 w-4" /> اشتراک‌گذاری لینک
                </Button>
                <Button variant="secondary" onClick={() => { setNoteLink(null); form.reset(); }} className="w-full">
                  ایجاد یادداشت دیگر
                </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-full">
        <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 flex flex-col p-4">
               <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                  <FormItem className="flex-1 flex flex-col">
                     <FormControl className="flex-1">
                        <Textarea
                        placeholder="یادداشت محرمانه خود را اینجا تایپ کنید..."
                        className="h-full resize-none text-base border-0 focus-visible:ring-0 focus-visible:ring-offset-0 p-0 shadow-none bg-transparent"
                        {...field}
                        />
                     </FormControl>
                     <FormMessage className="pt-2"/>
                  </FormItem>
                  )}
                  />
            </CardContent>
         </Card>
        <Card className="mt-4">
            <CardContent className="p-4 space-y-4">
                 <div className="space-y-1">
                    <h3 className="text-base font-medium tracking-tight">تنظیمات</h3>
                </div>
                <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>رمز عبور (اختیاری)</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="از یادداشت خود محافظت کنید" {...field} autoComplete="new-password" />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />

                <div className="grid grid-cols-2 gap-4 items-end">
                  <FormField
                      control={form.control}
                      name="expireValue"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>انقضا پس از</FormLabel>
                          <FormControl>
                          <Input type="number" placeholder="مثلاً ۲" {...field} />
                          </FormControl>
                      </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="expireUnit"
                      render={({ field }) => (
                      <FormItem>
                          <FormLabel>&nbsp;</FormLabel>
                          <FormControl>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <SelectTrigger>
                                  <SelectValue placeholder="واحد"/>
                                  </SelectTrigger>
                                  <SelectContent>
                                  <SelectItem value="minutes">دقیقه</SelectItem>
                                  <SelectItem value="hours">ساعت</SelectItem>
                                  <SelectItem value="days">روز</SelectItem>
                                  </SelectContent>
                              </Select>
                          </FormControl>
                      </FormItem>
                      )}
                  />
                </div>
                
                <FormField
                control={form.control}
                name="deleteAfterFirstView"
                render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm bg-background/20 mt-4">
                    <div className="space-y-0.5">
                        <FormLabel>تخریب خودکار</FormLabel>
                        <p className="text-sm text-muted-foreground">
                        یادداشت پس از اولین بازدید حذف شود.
                        </p>
                    </div>
                    <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                    </FormControl>
                    </FormItem>
                )}
                />

            </CardContent>
        </Card>


        <div className="sticky bottom-0 pt-6 pb-4 flex flex-col sm:flex-row gap-2">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                در حال ایجاد...
              </>
            ) : 'ایجاد لینک'
            }
          </Button>
        </div>
      </form>
    </Form>
  );
}
